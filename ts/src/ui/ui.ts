// ===================================================================
// 1. UTILITIES & BASIC TYPES (Unchanged)
// ===================================================================

import { nameof } from "../common/nameof.js";
import { addPoint } from "../common/point.js";
import { zeroSize } from "../module/ui/uiSize.js";
import type { RenderScope } from "../rendering/renderScope.js";
import type { TextStyle } from "../rendering/text/textStyle.js";

export type Point = { x: number; y: number };
export const zeroPoint = (): Point => ({ x: 0, y: 0 });

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

// Helper to compare dependency arrays for effects.
const depsAreEqual = (a: any[] | undefined, b: any[] | undefined): boolean => {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
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

export type PlacedChild = ComponentDescriptor & { offset: Point };

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
 * A type representing an object that must be empty (no properties).
 */
type EmptyObject = Record<PropertyKey, never>;

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

type NodeHooks = {
    effects: EffectHook[];
    draw?: (scope: any, region: Rectangle) => void;
};

export class UiRenderer {
    private currentTree: UiNode | null = null;
    private hooks: Map<UiNode, NodeHooks> = new Map();

    constructor(private renderScope: RenderScope) {}

    public renderComponent(topLevelDescriptor: ComponentDescriptor) {
        this.currentTree = this._updateOrCreateNode(
            this.currentTree ?? undefined,
            topLevelDescriptor,
        );
        if (this.currentTree) {
            this._executeNode(this.currentTree, this.renderScope.size, false);
            this._performDraw(this.currentTree, zeroPoint());
        }
    }

    private _executeNode(
        node: UiNode,
        constraints: UISize,
        isMeasurePass: boolean,
    ): UISize {
        const activeMeasureSlots = new Set<any>();
        let hookIndex = 0; // Scoped to this execution run

        const context: ComponentContext<any> = {
            props: node.descriptor.props,
            constraints: constraints,
            withState: <T>(state: T) => {
                return [state, () => {}];
            },
            withDraw: (drawFn) => {
                if (isMeasurePass) return;
                const nodeHooks = this.hooks.get(node) ?? { effects: [] };
                nodeHooks.draw = drawFn;
                this.hooks.set(node, nodeHooks);
            },
            withEffect: (effectFn, deps) => {
                if (isMeasurePass) return; // Skip effects during measurement.

                const currentHookIndex = hookIndex;
                const nodeHooks = this.hooks.get(node) ?? { effects: [] };
                if (!this.hooks.has(node)) {
                    this.hooks.set(node, nodeHooks);
                }

                const oldEffectHook = nodeHooks.effects[currentHookIndex];

                if (!oldEffectHook || !depsAreEqual(oldEffectHook.deps, deps)) {
                    // Run cleanup for the previous effect if it exists.
                    oldEffectHook?.cleanup?.();

                    // Run the new effect and store its cleanup function.
                    const cleanup = effectFn();
                    nodeHooks.effects[currentHookIndex] = {
                        deps,
                        cleanup: cleanup ?? undefined,
                    };
                }
                hookIndex++;
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

                this._executeNode(childNode, constraints, false);
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
                constraints,
                false,
            );
            node.layout = {
                offset: node.layout?.offset ?? zeroPoint(),
                region: { ...zeroPoint(), ...delegateSize },
            };
            return delegateSize;
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

    private _updateTransform(node: UiNode, parentAbsoluteOffset: Point) {
        if (!node.layout) return;

        const absoluteOffset = {
            x: parentAbsoluteOffset.x + node.layout.offset.x,
            y: parentAbsoluteOffset.y + node.layout.offset.y,
        };

        node.layout.region.x = absoluteOffset.x;
        node.layout.region.y = absoluteOffset.y;
        node.layout.region.width = node.layout.region.width ?? 0;
        node.layout.region.height = node.layout.region.height ?? 0;

        for (const child of node.children) {
            this._updateTransform(child, absoluteOffset);
        }
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
}
