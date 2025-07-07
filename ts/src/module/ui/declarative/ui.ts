// ===================================================================
// 1. UTILITIES & BASIC TYPES (Unchanged)
// ===================================================================

import { nameof } from "../../../common/nameof.js";
import { addPoint } from "../../../common/point.js";
import type { RenderScope } from "../../../rendering/renderScope.js";
import type { TextStyle } from "../../../rendering/text/textStyle.js";
import { fillUiSize, zeroSize } from "../uiSize.js";
import { uiBox } from "./uiBox.js";

export type Point = { x: number; y: number };
export const zeroPoint = (): Point => ({ x: 0, y: 0 });

export type UISize = { width: number; height: number };
export type Rectangle = { x: number; y: number; width: number; height: number };

// ===================================================================
// GESTURE AND EVENT TYPES
// ===================================================================

export type UIEventType = "tap" | "tapDown" | "tapUp" | "tapCancel";

export type UIEvent = {
    type: UIEventType;
    position: Point;
    startPosition?: Point;
    timestamp: number;
};

export type GestureHandler = (event: UIEvent) => boolean;

export type GestureRegistration = {
    eventType: UIEventType;
    handler: GestureHandler;
    hitTest?: (point: Point) => boolean;
};

const isLayoutResult = (
    value: LayoutResult | ComponentDescriptor,
): value is LayoutResult => {
    return (
        value &&
        typeof value[nameof<LayoutResult>("size")] === "object" &&
        Array.isArray(value[nameof<LayoutResult>("children")])
    );
};

// Helper to compare dependency arrays for effects.
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

// ===================================================================
// 2. CORE TYPES & INTERFACES (Unchanged)
// ===================================================================

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
    withDraw: (draw: (scope: any, region: Rectangle) => void) => void;
    withEffect: (effect: () => (() => void) | void, deps?: any[]) => void;
    withGesture: (
        eventType: UIEventType,
        handler: GestureHandler,
        hitTest?: (point: Point) => boolean,
    ) => void;
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

// ===================================================================
// 3. THE UNIFIED COMPONENT FACTORY (Unchanged)
// ===================================================================

/**
 * This is the type of the function returned by createUiComponent.
 * It conditionally defines the props argument.
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

// ===================================================================
// 4. THE UI RENDERER (Updated with all fixes)
// ===================================================================
type EffectHook = {
    deps?: any[];
    cleanup?: () => void;
};

type StateHook<T = any> = {
    value: T;
};

type NodeHooks = {
    effects: EffectHook[];
    states: StateHook[];
    draw?: (scope: any, region: Rectangle) => void;
    gestures?: GestureRegistration[];
};

export class UiRenderer {
    private currentTree: UiNode | null = null;
    private hooks: Map<UiNode, NodeHooks> = new Map();

    constructor(private renderScope: RenderScope) {}

    public renderComponent(topLevelDescriptor: ComponentDescriptor | null) {
        this.currentTree = this._updateOrCreateNode(
            this.currentTree ?? undefined,
            topLevelDescriptor ??
                uiBox({ width: fillUiSize, height: fillUiSize }),
        );
        if (this.currentTree) {
            this._executeNode(this.currentTree, this.renderScope.size, false);
            this._performDraw(this.currentTree, zeroPoint());
        }
    }

    /**
     * Dispatch a UI event to the declarative UI tree
     * Traverses the tree depth-first and checks for gesture handlers
     * @param event The UI event to dispatch
     * @returns true if the event was handled, false otherwise
     */
    public dispatchUIEvent(event: UIEvent): boolean {
        if (!this.currentTree) {
            return false;
        }

        return this._dispatchEventToNode(this.currentTree, event);
    }

    /**
     * Recursively dispatch an event to a node and its children
     * Children are checked first (depth-first) to allow deepest child to handle first
     */
    private _dispatchEventToNode(node: UiNode, event: UIEvent): boolean {
        // First, try to dispatch to children (depth-first)
        for (const child of node.children) {
            if (this._dispatchEventToNode(child, event)) {
                return true; // Event was handled by a child
            }
        }

        // If no child handled it, check if this node has gesture handlers
        const nodeHooks = this.hooks.get(node);
        if (!nodeHooks?.gestures || !node.layout) {
            return false;
        }

        const region = node.layout.region;

        // Check if the event position is within this node's bounds
        if (!this._isPointInRegion(event.position, region)) {
            return false;
        }

        // Try each gesture handler for this event type
        for (const gestureReg of nodeHooks.gestures) {
            if (gestureReg.eventType !== event.type) {
                continue; // Skip handlers for different event types
            }

            // Check custom hit test if provided
            if (gestureReg.hitTest && !gestureReg.hitTest(event.position)) {
                continue;
            }

            // Call the handler
            if (gestureReg.handler(event)) {
                return true; // Event was handled
            }
        }

        return false;
    }

    /**
     * Check if a point is within a rectangular region
     */
    private _isPointInRegion(point: Point, region: Rectangle): boolean {
        return (
            point.x >= region.x &&
            point.x <= region.x + region.width &&
            point.y >= region.y &&
            point.y <= region.y + region.height
        );
    }

    private _executeNode(
        node: UiNode,
        constraints: UISize,
        isMeasurePass: boolean,
    ): UISize {
        const activeMeasureSlots = new Set<any>();
        const copiedConstraints = { ...constraints };

        // Clear gestures array for this node to avoid accumulating handlers
        if (!isMeasurePass) {
            const nodeHooks = this.hooks.get(node) ?? {
                effects: [],
                states: [],
            };
            nodeHooks.gestures = [];
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
                // When a parent layout calculates a child's size during the
                // measure pass, that size must be preserved. Previously, the
                // calculated size on placedChild was discarded after a
                // measureDescriptor call. This caused the child to be incorrectly
                // re-measured during the layout pass based on its own properties
                // (e.g., "fill parent") instead of the dimensions determined by
                // its parent. The fix was to add a size property to placedChild.
                // This size is now applied to the childNode during layout,
                // ensuring custom dimensions from a parent layout are always respected.
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
        if (oldNode && oldNode.descriptor.type === descriptor.type) {
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

                    // Trigger re-render by re-executing the component
                    //this.renderComponent(this.currentTree?.descriptor ?? null);
                };

                return [currentState, setState];
            },
            withDraw: (drawFn) => {
                if (isMeasurePass) return;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                };
                nodeHooks.draw = drawFn;
                this.hooks.set(node, nodeHooks);
            },
            withGesture: (eventType, handler, hitTest) => {
                if (isMeasurePass) return;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
                };
                if (!nodeHooks.gestures) {
                    nodeHooks.gestures = [];
                }
                nodeHooks.gestures.push({
                    eventType,
                    handler,
                    hitTest,
                });
                this.hooks.set(node, nodeHooks);
            },
            withEffect: (effectFn, deps) => {
                if (isMeasurePass) return; // Skip effects during measurement.

                const currentHookIndex = hookIndex++;
                const nodeHooks = this.hooks.get(node) ?? {
                    effects: [],
                    states: [],
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
