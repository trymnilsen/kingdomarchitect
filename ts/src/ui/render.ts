import { removeItem } from "../common/array.js";
import type {
    ComponentContext,
    ComponentDescriptor,
    ComponentDescriptorWithChildren,
} from "./component.js";

/**
 * Ui is an extension of the component descriptor and builds up the tree of
 * components. During reconciliation we will use this tree to try and find
 * existing nodes can we can update with the values of the a new
 * componentdescriptor if it matches a node
 */
export type UiNode = {
    children: UiNode[];
    descriptor: ComponentDescriptor;
    generation: number;
};

export class UiRenderer {
    //A reference to the top root component
    private currentTree: UiNode | null = null;
    private currentGeneration: number = 1;
    //We keep a map of our hooks for look up, the first key is component
    //the hook belongs to. Then we have a map with hookIndex as the key
    //and the hook itself
    private hooks: Map<ComponentDescriptor, Map<number, () => void>> =
        new Map();

    /**
     * Render a new tree of components based on the root component
     * @param descriptor the descriptor for the root node, for example app()
     */
    renderComponent(descriptor: ComponentDescriptor) {
        //compose the new tree
        //TODO if the descriptor is different from the current one we need to dispose
        this.currentGeneration += 1;
        const newTree = this.composeComponent(null, descriptor);
        this.currentTree = newTree;
        //Run layout on tree
        //Run draw on tree
    }

    /**
     * Based on a list of children, will attempt to find an existing node or
     * create a new one
     * @param oldChildren
     * @param descriptor
     */
    private reconcileNode(
        parent: UiNode | null,
        descriptor: ComponentDescriptor,
    ): UiNode {
        let children = parent?.children;
        if (!children && !parent) {
            children = this.currentTree ? [this.currentTree] : [];
        }

        if (!children) {
            throw new Error("Cannot find any children, unable to reconile");
        }

        //look for any children where type and key matches
        const matchingKeyNode = children.find(
            (node) =>
                node.descriptor.type == descriptor.type &&
                !!node.descriptor.key &&
                node.descriptor.key == descriptor.key,
        );
        if (!!matchingKeyNode) {
            return this.updateNodeWithDescriptor(matchingKeyNode, descriptor);
        }

        //look for any matching type
        //TODO: Change this? Is it too loose should we also add index matching
        const matchingTypeNode = children.find(
            (node) => node.descriptor.type == descriptor.type,
        );
        if (!!matchingTypeNode) {
            return this.updateNodeWithDescriptor(matchingTypeNode, descriptor);
        }

        //No matches create a new one
        return {
            generation: 0,
            children: [],
            descriptor: descriptor,
        };
    }

    private updateNodeWithDescriptor(
        node: UiNode,
        descriptor: ComponentDescriptor,
    ): UiNode {
        node.descriptor = descriptor;
        return node;
    }

    private composeComponent(
        parent: UiNode | null,
        descriptor: ComponentDescriptor,
    ): UiNode {
        const currentNode = this.reconcileNode(parent, descriptor);
        //If the generation is zero, its a new node so we assign the current
        if (currentNode.generation === 0) {
            currentNode.generation = this.currentGeneration;
        }
        const componentContext = this.buildComponentContext(currentNode);
        //Run render method on the node
        const renderOutput = descriptor.renderFn(componentContext);
        if (!!renderOutput) {
            const children = Array.isArray(renderOutput)
                ? renderOutput
                : [renderOutput];
            //Run render on the remaining children
            for (const child of children) {
                const composedChild = this.composeComponent(currentNode, child);
                //TODO: needs to be a set to avoid pushing duplicates?
                node.children.push(composedChild);
            }
        }

        //TODO - do a loop over and dispose of any nodes that are not in the
        //current generation
        for (const child of currentNode.children) {
            if (child.generation < this.currentGeneration) {
                this.cleanupChild(child);
            }
        }
        return node;
    }

    private cleanupChild(uiNode: UiNode) {
        throw new Error("Not implemented");
    }

    private buildComponentContext(
        descriptor: ComponentDescriptor,
    ): ComponentContext<{}> {
        let hookIndex = 0;
        return {
            props: descriptor.props,
            useEffect: (fn, _deps) => {
                let hookMap = this.hooks.get(descriptor);
                if (!hookMap) {
                    hookMap = new Map();
                    this.hooks.set(descriptor, hookMap);
                }

                const hook = hookMap.get(hookIndex);
                if (!hook) {
                    hookMap.set(hookIndex, fn);
                    fn();
                }
                hookIndex++;
            },
            useState: (val) => [val, () => {}],
        };
    }
}

//Hooks can
// - request compose (for adding or removing items)
// - request layout (when items havnt changed, but size might)
// - request draw (when the color has changed)
