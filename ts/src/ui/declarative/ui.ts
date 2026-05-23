import { log } from "../../common/logging/logger.ts";
import { nameof } from "../../common/nameof.ts";
import { addPoint, zeroPoint, type Point } from "../../common/point.ts";
import type { RenderScope } from "../../rendering/renderScope.ts";
import type { TextStyle } from "../../rendering/text/textStyle.ts";
import { fillUiSize, zeroSize } from "../uiSize.ts";
import { pointerChainAt } from "./pointerChain.ts";
import { PointerTracker, type PointerFlags } from "./pointerTracker.ts";

export type UISize = { width: number; height: number };
export type Rectangle = { x: number; y: number; width: number; height: number };

const isLayoutResult = (
    value: LayoutResult | ComponentDescriptor,
): value is LayoutResult => {
    return (
        value &&
        typeof value[nameof<LayoutResult>("size")] === "object" &&
        Array.isArray(value[nameof<LayoutResult>("children")])
    );
};

// Deps are equal when same length and every entry is ===. Used to decide
// whether an effect or remember can be skipped this render.
const _depsAreEqual = (a: any[] | undefined, b: any[] | undefined): boolean => {
    // If the identities are the same (e.g., both undefined), they are equal.
    if (a === b) {
        return true;
    }

    // If one is defined and the other isn't, or if lengths differ, they are not equal.
    if (!a || !b || a.length !== b.length) {
        return false;
    }

    // Check if all elements are strictly equal.
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

export type LayoutInfo = {
    offset: Point;
    region: Rectangle;
};

export type UiNode = {
    children: UiNode[];
    descriptor: ComponentDescriptor;
    layout?: LayoutInfo;
    measurementSlots?: Map<any, UiNode>;
};

export type PlacedChild = ComponentDescriptor & { offset: Point; size: UISize };

export type LayoutResult = {
    size: UISize;
    children: PlacedChild[];
};

export type ComponentContext<P extends {}> = {
    props: P;
    constraints: UISize;
    measureText: (text: string, textStyle: TextStyle) => UISize;
    measureDescriptor: (
        slotId: any,
        descriptor: ComponentDescriptor,
        constraints: UISize,
    ) => UISize;
    withState: <T>(
        state: T,
    ) => [T, (newValue: T | ((currentValue: T) => T)) => void];
    withDraw: (draw: (scope: RenderScope, region: Rectangle) => void) => void;
    withEffect: (effect: () => (() => void) | void, deps?: any[]) => void;
    withRemember: <T>(factory: () => T, deps?: any[]) => T;
    /**
     * Reads this component's pointer flags ({@link PointerFlags}) and marks it
     * as an interactive hit-test target. Tells the component whether it is
     * pressed, and later hovered. The flags come from the renderer fresh each
     * render, so the component just reads them again on the render after a
     * pointer event.
     */
    withPointerState: () => PointerFlags;
    /**
     * Registers a tap handler and marks this component as an interactive
     * hit-test target. The handler runs when a press starts and ends on the
     * same component. You can use this hook with or without
     * {@link withPointerState}.
     */
    withPointerTap: (handler: () => void) => void;
};

type RenderFunction<P extends {}> = (
    context: ComponentContext<P>,
) => LayoutResult | ComponentDescriptor;

export type ComponentDescriptor<P extends {} = any> = {
    type: Function;
    renderFn: RenderFunction<P>;
    props: P;
    key?: string | number;
};

/**
 * Call signature for a component. A component with no props takes no arguments,
 * so callers write myComponent() instead of myComponent({}).
 */
export type ComponentType<P extends {}> = [keyof P] extends [never] // Checks if P has no keys (e.g., P is {} or an empty interface)
    ? () => ComponentDescriptor<P> // If P is empty, props are optional and must be an empty object
    : (props: P) => ComponentDescriptor<P>; // Otherwise, props are required and of type P

export function createComponent<P extends {} = {}>(
    renderFn: RenderFunction<P>,
    options?: { displayName?: string },
): ComponentType<P> {
    const componentType = (props: P): ComponentDescriptor<P> => ({
        type: componentType,
        renderFn: renderFn,
        props: props,
        key: (props as any)?.key,
    });
    Object.defineProperty(componentType, "name", {
        value: options?.displayName || "Component",
    });
    return componentType as ComponentType<P>;
}

export function sized(width: number, height: number) {
    return {
        children: [],
        size: {
            width,
            height,
        },
    };
}

type EffectHook = {
    deps?: any[];
    cleanup?: () => void;
};

type StateHook<T = any> = {
    value: T;
};

type RememberHook<T = any> = {
    deps?: any[];
    value: T;
};

type NodeHooks = {
    effects: EffectHook[];
    states: StateHook[];
    remembers: RememberHook[];
    draw?: (scope: any, region: Rectangle) => void;
    /** True when this node opted into pointer tracking this render. */
    interactive?: boolean;
    /** Tap handler registered via withPointerTap this render, if any. */
    onTap?: () => void;
};

export class UiRenderer {
    private currentTree: UiNode | null = null;
    private hooks: Map<UiNode, NodeHooks> = new Map();
    private renderScope: RenderScope;
    private pointer = new PointerTracker();

    constructor(renderScope: RenderScope) {
        this.renderScope = renderScope;
    }

    public renderComponent(topLevelDescriptor: ComponentDescriptor | null) {
        const newDescriptor = topLevelDescriptor;

        const oldTree = this.currentTree;
        if (newDescriptor === null) {
            if (oldTree) {
                this._cleanupNode(oldTree);
            }

            return;
        }

        this.currentTree = this._updateOrCreateNode(
            this.currentTree ?? undefined,
            newDescriptor,
        );

        // If we created a new root node (different key or type), clean up the old tree
        if (oldTree && oldTree !== this.currentTree) {
            log.debug("Root node changed, cleaning up old tree");
            this._cleanupNode(oldTree);
        }

        if (this.currentTree) {
            this._executeNode(this.currentTree, this.renderScope.size, false);
            this._performDraw(this.currentTree, zeroPoint());
        }
    }

    /**
     * Begins a press at `point`. Records the interactive chain under the point
     * so every component in it reads as pressed on the next render.
     *
     * @returns true when the press landed on an interactive component. Callers
     *     use this to decide whether something outside the UI should also handle
     *     the press, like a world tap or a camera drag.
     */
    public onPointerDown(point: Point): boolean {
        const chain = this.interactiveChainAt(point);
        this.pointer.setPressed(chain);
        return chain.length > 0;
    }

    /**
     * Ends a press at `point`. Runs the onTap of the innermost component that
     * was pressed and released on, then clears the press.
     *
     * @returns true when a tap handler ran.
     */
    public onPointerUp(point: Point): boolean {
        const upChain = this.interactiveChainAt(point);

        let handled = false;
        // Innermost first: the deepest component that saw both down and up wins.
        for (let i = upChain.length - 1; i >= 0; i--) {
            const node = upChain[i];
            const nodeHooks = this.hooks.get(node);
            if (nodeHooks?.onTap && this.pointer.isPressed(node)) {
                nodeHooks.onTap();
                handled = true;
                break;
            }
        }

        this.pointer.clearPressed();
        return handled;
    }

    /**
     * Drops the current press without running a tap. Called when the gesture
     * turns into a drag, the pointer leaves, or the touch is cancelled. This is
     * what stops a component from getting stuck looking pressed.
     */
    public onPointerCancel(): void {
        this.pointer.clearPressed();
    }

    /** Hit-tests the current tree for the interactive chain under `point`. */
    private interactiveChainAt(point: Point): UiNode[] {
        if (!this.currentTree) {
            return [];
        }
        return pointerChainAt(
            this.currentTree,
            point,
            (node) => this.hooks.get(node)?.interactive === true,
        );
    }

    private _executeNode(
        node: UiNode,
        constraints: UISize,
        isMeasurePass: boolean,
    ): UISize {
        const activeMeasureSlots = new Set<any>();
        const copiedConstraints = { ...constraints };

        // Clear the interaction registration each render so it only reflects
        // what this render asks for. A component might register conditionally.
        if (!isMeasurePass) {
            const nodeHooks = this.hooks.get(node) ?? {
                effects: [],
                states: [],
                remembers: [],
            };
            nodeHooks.interactive = false;
            nodeHooks.onTap = undefined;
            this.hooks.set(node, nodeHooks);
        }

        const context = this._buildComponentContext(
            node,
            copiedConstraints,
            isMeasurePass,
            activeMeasureSlots,
        );

        const renderOutput = node.descriptor.renderFn(context);

        if (node.measurementSlots) {
            for (const slotId of node.measurementSlots.keys()) {
                if (!activeMeasureSlots.has(slotId)) {
                    this._cleanupNode(node.measurementSlots.get(slotId)!);
                    node.measurementSlots.delete(slotId);
                }
            }
        }

        if (isLayoutResult(renderOutput)) {
            node.children = this._reconcileChildren(
                node,
                renderOutput.children,
            );

            for (const childNode of node.children) {
                // The descriptor on the reconciled node IS the PlacedChild object.
                const placedChild = childNode.descriptor as PlacedChild;

                // Apply the offset from the placement instruction.
                if (!childNode.layout) {
                    childNode.layout = {
                        offset: zeroPoint(),
                        region: { ...zeroPoint(), ...zeroSize() },
                    };
                }

                childNode.layout.offset = placedChild.offset;
                // Apply the size the parent computed for this child. Without it
                // the child would re-measure from its own props (like "fill
                // parent") and ignore the size its parent chose.
                this._executeNode(childNode, { ...placedChild.size }, false);
            }

            node.layout = {
                offset: node.layout?.offset ?? zeroPoint(),
                region: { ...zeroPoint(), ...renderOutput.size },
            };
            return renderOutput.size;
        } else {
            node.children = this._reconcileChildren(node, [renderOutput]);
            const delegateChild = node.children[0];
            if (!delegateChild) {
                node.layout = {
                    offset: node.layout?.offset ?? zeroPoint(),
                    region: { ...zeroPoint(), width: 0, height: 0 },
                };
                return { width: 0, height: 0 };
            }
            const delegateSize = this._executeNode(
                delegateChild,
                copiedConstraints,
                false,
            );

            const width = delegateChild.descriptor.props.width;
            const height = delegateChild.descriptor.props.heigt;

            const size = {
                width: delegateSize.width,
                height: delegateSize.height,
            };
            if (width >= 0) {
                size.width = width;
            } else if (width == fillUiSize) {
                size.width = copiedConstraints.width;
            }

            if (height >= 0) {
                size.height = height;
            } else if (height == fillUiSize) {
                size.height = copiedConstraints.height;
            }

            node.layout = {
                offset: node.layout?.offset ?? zeroPoint(),
                region: { x: 0, y: 0, width: size.width, height: size.height },
            };
            return size;
        }
    }

    private _updateOrCreateNode(
        oldNode: UiNode | undefined,
        descriptor: ComponentDescriptor,
    ): UiNode {
        const nodeType = descriptor.type?.name || descriptor.type || "unknown";
        const nodeKey = descriptor.key || "no-key";

        if (
            oldNode &&
            oldNode.descriptor.type === descriptor.type &&
            oldNode.descriptor.key === descriptor.key
        ) {
            oldNode.descriptor = descriptor;
            return oldNode;
        }
        return { children: [], descriptor };
    }

    private _reconcileChildren(
        parent: UiNode,
        newChildDescriptors: ComponentDescriptor[],
    ): UiNode[] {
        const newChildren: UiNode[] = [];
        const oldChildren = parent.children;
        const oldChildrenByKey = new Map<any, UiNode>();
        const oldChildrenWithoutKeys: UiNode[] = [];

        for (const child of oldChildren) {
            if (child.descriptor.key != null) {
                oldChildrenByKey.set(child.descriptor.key, child);
            } else {
                oldChildrenWithoutKeys.push(child);
            }
        }

        let lastUnkeyedIndex = 0;
        for (const descriptor of newChildDescriptors) {
            let oldNode: UiNode | undefined = undefined;

            if (descriptor.key != null) {
                oldNode = oldChildrenByKey.get(descriptor.key);
                if (oldNode) {
                    oldChildrenByKey.delete(descriptor.key);
                }
            } else {
                for (
                    let i = lastUnkeyedIndex;
                    i < oldChildrenWithoutKeys.length;
                    i++
                ) {
                    if (
                        oldChildrenWithoutKeys[i].descriptor.type ===
                        descriptor.type
                    ) {
                        oldNode = oldChildrenWithoutKeys[i];
                        oldChildrenWithoutKeys.splice(i, 1);
                        break;
                    }
                }
            }

            const newChildNode = this._updateOrCreateNode(oldNode, descriptor);
            newChildren.push(newChildNode);
        }

        for (const unusedNode of oldChildrenByKey.values()) {
            this._cleanupNode(unusedNode);
        }
        for (const unusedNode of oldChildrenWithoutKeys) {
            this._cleanupNode(unusedNode);
        }

        return newChildren;
    }

    private _performDraw(node: UiNode, parentPosition: Point) {
        if (!node.layout) {
            throw new Error("Cannot draw ui not layouted");
        }
        const absolutePosition = addPoint(parentPosition, node.layout.offset);
        node.layout.region.x = absolutePosition.x;
        node.layout.region.y = absolutePosition.y;

        const nodeHooks = this.hooks.get(node);
        if (nodeHooks && nodeHooks.draw && node.layout) {
            nodeHooks.draw(this.renderScope, node.layout.region);
        }
        for (const child of node.children) {
            this._performDraw(child, absolutePosition);
        }
    }

    private _cleanupNode(node: UiNode) {
        // Run cleanup functions for all effects before removing the node.
        const nodeHooks = this.hooks.get(node);
        const nodeType =
            node.descriptor.type?.name || node.descriptor.type || "unknown";
        const nodeKey = node.descriptor.key || "no-key";
        if (nodeHooks) {
            for (const effect of nodeHooks.effects) {
                effect.cleanup?.();
            }
        }

        if (node.measurementSlots) {
            for (const measureNode of node.measurementSlots.values()) {
                this._cleanupNode(measureNode);
            }
            node.measurementSlots.clear();
        }

        for (const child of node.children) {
            this._cleanupNode(child);
        }

        // Forget the node so one that's going away doesn't stay in the pressed
        // or hovered set.
        this.pointer.forget(node);
        this.hooks.delete(node);
    }

    private _buildComponentContext(
        node: UiNode,
        constraints: UISize,
        isMeasurePass: boolean,
        activeMeasureSlots: Set<any>,
    ): ComponentContext<any> {
        let hookIndex = 0;

        return {
            props: node.descriptor.props,
            constraints: constraints,
            withState: <T>(state: T) => {
                const currentHookIndex = hookIndex++;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                    remembers: [],
                };
                if (!this.hooks.has(node)) {
                    this.hooks.set(node, nodeHooks);
                }

                // Initialize state if this is the first time this hook is called
                if (!nodeHooks.states[currentHookIndex]) {
                    nodeHooks.states[currentHookIndex] = { value: state };
                }

                const currentState = nodeHooks.states[currentHookIndex]
                    .value as T;
                const setState = (newValue: T | ((currentValue: T) => T)) => {
                    const updatedValue =
                        typeof newValue === "function"
                            ? (newValue as (currentValue: T) => T)(currentState)
                            : newValue;
                    nodeHooks.states[currentHookIndex].value = updatedValue;

                    // Setting state does not trigger a re-render on its own. A
                    // redraw happens because callers render after every input.
                };

                return [currentState, setState];
            },
            withDraw: (drawFn) => {
                if (isMeasurePass) return;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                    remembers: [],
                };
                nodeHooks.draw = drawFn;
                this.hooks.set(node, nodeHooks);
            },
            withPointerState: () => {
                if (isMeasurePass) {
                    return { pressed: false, hovered: false };
                }
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                    remembers: [],
                };
                nodeHooks.interactive = true;
                this.hooks.set(node, nodeHooks);
                return this.pointer.flagsFor(node);
            },
            withPointerTap: (handler) => {
                if (isMeasurePass) return;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                    remembers: [],
                };
                nodeHooks.interactive = true;
                nodeHooks.onTap = handler;
                this.hooks.set(node, nodeHooks);
            },
            withEffect: (effectFn, deps) => {
                if (isMeasurePass) return; // Skip effects during measurement.

                const currentHookIndex = hookIndex++;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                    remembers: [],
                };
                if (!this.hooks.has(node)) {
                    this.hooks.set(node, nodeHooks);
                }

                const oldEffectHook = nodeHooks.effects[currentHookIndex];

                if (
                    !oldEffectHook ||
                    !_depsAreEqual(oldEffectHook.deps, deps)
                ) {
                    // Run cleanup for the previous effect if it exists.
                    oldEffectHook?.cleanup?.();

                    // Run the new effect and store its cleanup function.
                    const cleanup = effectFn();
                    nodeHooks.effects[currentHookIndex] = {
                        deps,
                        cleanup: cleanup ?? undefined,
                    };
                }
            },
            withRemember: <T>(factory: () => T, deps?: any[]): T => {
                const currentHookIndex = hookIndex++;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                    remembers: [],
                };
                if (!this.hooks.has(node)) {
                    this.hooks.set(node, nodeHooks);
                }

                const oldRememberHook = nodeHooks.remembers[currentHookIndex];

                if (
                    !oldRememberHook ||
                    !_depsAreEqual(oldRememberHook.deps, deps)
                ) {
                    // Recompute the value if dependencies changed
                    const value = factory();
                    nodeHooks.remembers[currentHookIndex] = {
                        deps,
                        value,
                    };
                    return value;
                }

                // Return the cached value
                return oldRememberHook.value as T;
            },
            measureText: (text, style) => {
                return this.renderScope.measureText(text, style);
            },
            measureDescriptor: (slotId, descriptor, measureConstraints) => {
                activeMeasureSlots.add(slotId);
                if (!node.measurementSlots) {
                    node.measurementSlots = new Map();
                }

                const oldMeasureNode = node.measurementSlots.get(slotId);
                const newMeasureNode = this._updateOrCreateNode(
                    oldMeasureNode,
                    descriptor,
                );
                node.measurementSlots.set(slotId, newMeasureNode);
                return this._executeNode(
                    newMeasureNode,
                    measureConstraints,
                    true,
                );
            },
        };
    }
}
