import type { Bounds } from "../common/bounds.js";
import type { Rectangle } from "../common/structure/rectangle.js";
import type { UIEvent } from "../module/ui/event/uiEvent.js";
import type { UILayoutScope } from "../module/ui/uiLayoutContext.js";
import type { UISize } from "../module/ui/uiSize.js";
import type { UIRenderScope } from "../rendering/uiRenderContext.js";
import type { UiNode } from "./render.js";

export type LayoutInfo = {
    width: number;
    height: number;
    x: number;
    y: number;
};

/**
 * The function provided to a layout hook
 * @param constraints the constraints available
 */
export type LayoutHook = (
    constraints: UISize,
    node: UiNode,
    layout: (constraints: UISize, node: UiNode) => UISize,
    measure: UILayoutScope,
) => UISize;

export type DrawHook = (context: UIRenderScope, region: Rectangle) => void;

export type ComponentContext<P extends {}> = {
    props: P;
    /**
     * Set a custom layout hook for this component
     * @param layout the LayoutHook to invoke during layout
     * @returns
     */
    withLayout: (layout: LayoutHook) => void;
    withDraw: (draw: DrawHook) => void;
    withGesture: (handler: (uiEvent: UIEvent) => boolean) => void;
    withState: <S>(initalValue: S) => [S, (newValue: S) => void];
    withEffect: (fn: () => void, deps?: any[]) => void;
};

export type ComponentDescriptor<P extends {} = any> = {
    type: Function; //The component factory method, typed as function as we mostly use it for identity at runtime
    renderFn: RenderFunction<P>; // The function containing hooks and returning a PrimitiveDescriptor
    props: P;
    key?: string | number; // For list reconciliation
};

export type ComponentDescriptorWithChildren = ComponentDescriptor & {
    children: ComponentDescriptor[];
};

// The function containing component logic and hooks
type RenderFunction<P extends {}> = (
    context: ComponentContext<P>,
) => ComponentDescriptor | ComponentDescriptor[] | void;

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
// The type for a component factory function (returned by createComponent)
// type ComponentType<P extends {}> = (props: P) => ComponentDescriptor<P>;
/**
 * Creates a component factory.
 * @param renderFn The function that defines the component's logic and UI.
 * This function can use hooks and returns a PrimitiveDescriptor.
 */
export function createUiComponent<P extends {} = {}>(
    renderFn: RenderFunction<P>,
    options?: { displayName?: string }, // Optional display name for better debugging
): ComponentType<P> {
    const componentType: ComponentType<P> = ((
        props: P,
    ): ComponentDescriptor<P> => {
        //TODO: Combine built in (key and children) and user props
        return {
            type: componentType,
            renderFn: renderFn,
            props: props,
            key: (props as any)?.key, // Pass key through if provided in props
        };
    }) as ComponentType<P>;
    // Assign display name for easier debugging
    Object.defineProperty(componentType, "name", {
        value: options?.displayName || renderFn.name || "AnonymousComponent",
        configurable: true,
    });
    return componentType;
}
