import { removeItem } from "../common/array.js";
import { addPoint, zeroPoint, type Point } from "../common/point.js";
import type { Rectangle } from "../common/structure/rectangle.js";
import type { UISize } from "../module/ui/uiSize.js";
import type { RenderScope } from "../rendering/renderScope.js";
import type {
    ComponentContext,
    ComponentDescriptor,
    ComponentDescriptorWithChildren,
    DrawHook,
    LayoutHook,
} from "./component.js";
import { setLayout } from "./layout.js";

export type LayoutInfo = {
    offset: Point;
    region: Rectangle;
};

/**
 * Ui is an extension of the component descriptor and builds up the tree of
 * components. During reconciliation we will use this tree to try and find
 * existing nodes can we can update with the values of the a new
 * componentdescriptor if it matches a node
 */
export type UiNode = {
    children: UiNode[];
    descriptor: ComponentDescriptor;
    layout?: LayoutInfo;
};

type Hook = {
    type: keyof Omit<ComponentContext<{}>, "props">;
    fn: () => void;
};

const zeroOffset = zeroPoint();

export class UiRenderer {
    //A reference to the top root component
    private currentTree: UiNode | null = null;
    private currentGeneration: number = 1;
    //We keep a map of our hooks for look up, the first key is component
    //the hook belongs to. Then we have a map with hookIndex as the key
    //and the hook itself
    private hooks: Map<UiNode, Map<number, Hook>> = new Map();

    constructor(private renderScope: RenderScope) {}
    /**
     * Render a new tree of components based on the root component
     * @param descriptor the descriptor for the root node, for example app()
     */
    renderComponent(descriptor: ComponentDescriptor) {
        const start = performance.now();
        // The root-level reconciliation is slightly different
        const rootNodeToCompose =
            this.currentTree?.descriptor.type === descriptor.type
                ? this.currentTree
                : undefined;

        const newTree = this.composeNode(rootNodeToCompose, descriptor);

        // If we created an entirely new root, cleanup the old tree
        if (this.currentTree && this.currentTree !== newTree) {
            this.cleanupChild(this.currentTree);
        }

        this.currentTree = newTree;
        this.performLayout(this.renderScope.size, newTree);
        this.updateTransform(newTree, zeroOffset);
        console.log("Layout performed", newTree);
        this.performDraw(newTree);
        console.log("Render time: ", performance.now() - start);
    }

    private updateTransform(node: UiNode, parentOffset: Point) {
        if (!node.layout) {
            throw new Error("Layout not set for node");
        }
        const totalOffset = addPoint(node.layout.offset, parentOffset);
        node.layout.region.x = totalOffset.x;
        node.layout.region.y = totalOffset.y;

        for (const child of node.children) {
            this.updateTransform(child, totalOffset);
        }
    }

    private performLayout(constraints: UISize, node: UiNode): UISize {
        const layoutHook = Array.from(
            this.hooks.get(node)?.values() ?? [],
        ).find((item) => item.type == "withLayout");

        if (layoutHook) {
            const layoutFn = layoutHook.fn as unknown as LayoutHook;
            const childLayout: (constraints: UISize, node: UiNode) => UISize = (
                childConstraints,
                childNode,
            ) => {
                return this.performLayout(childConstraints, childNode);
            };

            const size = layoutFn(
                constraints,
                node,
                childLayout,
                this.renderScope,
            );

            setLayout(node, size);
            return size;
        } else {
            //No default hook, assume the the size of the incomming constraints
            //before looping into children
            setLayout(node, constraints);
            for (const child of node.children) {
                this.performLayout(constraints, child);
            }
            return constraints;
        }
    }

    private performDraw(node: UiNode) {
        const drawHook = Array.from(this.hooks.get(node)?.values() ?? []).find(
            (item) => item.type == "withDraw",
        );

        if (drawHook) {
            if (node.layout) {
                const drawFn = drawHook.fn as unknown as DrawHook;
                drawFn(this.renderScope, node.layout.region);
            } else {
                console.error("Node has not been layed out, cannot draw");
            }
        }

        for (const child of node.children) {
            this.performDraw(child);
        }
    }

    private reconcileChildren(
        parent: UiNode,
        newChildDescriptors: ComponentDescriptor[],
    ): UiNode[] {
        const newChildren: UiNode[] = [];
        const oldChildren = parent.children;

        // Create a map of old keyed children for fast lookups
        const oldKeyedChildren = new Map<string | number, UiNode>();
        const oldUnkeyedChildren: UiNode[] = [];
        for (const child of oldChildren) {
            if (child.descriptor.key != null) {
                oldKeyedChildren.set(child.descriptor.key, child);
            } else {
                oldUnkeyedChildren.push(child);
            }
        }

        let unkeyedIndex = 0;

        // --- Main Reconciliation Loop ---
        for (const descriptor of newChildDescriptors) {
            let oldNode: UiNode | undefined = undefined;

            // 1. Try to find a match by key
            if (descriptor.key != null) {
                oldNode = oldKeyedChildren.get(descriptor.key);
                if (oldNode) {
                    oldKeyedChildren.delete(descriptor.key); // Mark as used
                }
            }
            // 2. If no key, try to find a match by type at the current index
            else if (unkeyedIndex < oldUnkeyedChildren.length) {
                const potentialMatch = oldUnkeyedChildren[unkeyedIndex];
                if (potentialMatch.descriptor.type === descriptor.type) {
                    oldNode = potentialMatch;
                    unkeyedIndex++;
                }
            }

            // 3. Compose the child (either updating an old node or creating a new one)
            const newChildNode = this.composeNode(oldNode, descriptor);
            newChildren.push(newChildNode);
        }

        // --- Cleanup ---
        // Any nodes left in the maps/arrays are unmounted
        for (const unusedNode of oldKeyedChildren.values()) {
            this.cleanupChild(unusedNode);
        }
        for (let i = unkeyedIndex; i < oldUnkeyedChildren.length; i++) {
            this.cleanupChild(oldUnkeyedChildren[i]);
        }

        return newChildren;
    }

    private updateNodeWithDescriptor(
        node: UiNode,
        descriptor: ComponentDescriptor,
    ): UiNode {
        node.descriptor = descriptor;
        return node;
    }

    // Was composeComponent, now focused on a single node
    private composeNode(
        oldNode: UiNode | undefined,
        descriptor: ComponentDescriptor,
    ): UiNode {
        // 1. Reconcile the node itself (update or create)
        const currentNode: UiNode = oldNode
            ? this.updateNodeWithDescriptor(oldNode, descriptor)
            : {
                  children: [],
                  descriptor: descriptor,
              };

        // 2. Build context and get new child descriptors
        const componentContext = this.buildComponentContext(currentNode);
        const renderOutput = descriptor.renderFn(componentContext);
        const newChildDescriptors = renderOutput
            ? Array.isArray(renderOutput)
                ? renderOutput
                : [renderOutput]
            : [];

        // 3. Delegate child reconciliation to the new function
        currentNode.children = this.reconcileChildren(
            currentNode,
            newChildDescriptors,
        );

        return currentNode;
    }

    private cleanupChild(uiNode: UiNode) {
        //Dispose for children and up
        for (const child of uiNode.children) {
            this.cleanupChild(child);
        }
        //Get any hooks for this node
        const nodeHooks = this.hooks.get(uiNode);
        if (nodeHooks) {
            //TODO: implement this
        }

        this.hooks.delete(uiNode);
    }

    private buildComponentContext(node: UiNode): ComponentContext<{}> {
        let hookIndex = 0;
        return {
            props: node.descriptor.props,
            withDraw: (fn) => {
                let hookMap = this.hooks.get(node);
                if (!hookMap) {
                    hookMap = new Map();
                    this.hooks.set(node, hookMap);
                }

                const hook = hookMap.has(hookIndex);
                if (!hook) {
                    hookMap.set(hookIndex, {
                        type: "withDraw",
                        fn: fn as any, //TODO: Figure out this typing, maybe union?
                    });
                }
                hookIndex++;
            },
            withGesture: () => {},
            withLayout: (fn) => {
                let hookMap = this.hooks.get(node);
                if (!hookMap) {
                    hookMap = new Map();
                    this.hooks.set(node, hookMap);
                }

                const hook = hookMap.has(hookIndex);
                if (!hook) {
                    hookMap.set(hookIndex, {
                        type: "withLayout",
                        fn: fn as any, //TODO: Figure out this typing, maybe union?
                    });
                }
                hookIndex++;
            },
            withEffect: (fn, _deps) => {
                let hookMap = this.hooks.get(node);
                if (!hookMap) {
                    hookMap = new Map();
                    this.hooks.set(node, hookMap);
                }

                const hook = hookMap.has(hookIndex);
                if (!hook) {
                    hookMap.set(hookIndex, {
                        type: "withEffect",
                        fn: fn,
                    });
                    fn();
                }
                hookIndex++;
            },
            withState: (val) => [val, () => {}],
        };
    }
}

//Hooks can
// - request compose (for adding or removing items)
// - request layout (when items havnt changed, but size might)
// - request draw (when the color has changed)
