import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.ts";

export type UiAbsoluteLayerOverlay = {
    /** Horizontal center of the overlay in screen space. */
    anchorX: number;
    /** Bottom edge of the overlay in screen space. */
    anchorY: number;
    child: ComponentDescriptor;
};

export type UiAbsoluteLayerProps = {
    /** Base component that fills the available space. */
    base: ComponentDescriptor;
    /** Zero or more overlays positioned at world-space anchor points. */
    overlays: UiAbsoluteLayerOverlay[];
};

/**
 * Layout component that renders a base component filling the full screen
 * plus zero or more overlays each centered at a given anchor point.
 *
 * Each overlay is bottom-center anchored: anchorX is the horizontal center
 * and anchorY is the bottom edge of the overlay in screen space.
 */
export const uiAbsoluteLayer = createComponent<UiAbsoluteLayerProps>(
    ({ props, measureDescriptor, constraints }) => {
        const placedChildren: PlacedChild[] = [];

        // Base fills the full constraints
        measureDescriptor("base", props.base, constraints);
        placedChildren.push({
            ...props.base,
            size: constraints,
            offset: { x: 0, y: 0 },
        });

        // Each overlay is measured and placed centered at its anchor point
        for (let i = 0; i < props.overlays.length; i++) {
            const overlay = props.overlays[i];
            const childSize = measureDescriptor(
                `overlay-${i}`,
                overlay.child,
                constraints,
            );
            // Anchors are absolute screen coordinates, so the overlay is
            // placed absolutely. This keeps anchoring correct even when the
            // layer itself is nested away from the screen origin.
            placedChildren.push({
                ...overlay.child,
                size: childSize,
                absolute: true,
                offset: {
                    x: overlay.anchorX - Math.floor(childSize.width / 2),
                    y: overlay.anchorY - childSize.height,
                },
            });
        }

        return {
            children: placedChildren,
            size: constraints,
        };
    },
    { displayName: "UiAbsoluteLayer" },
);
