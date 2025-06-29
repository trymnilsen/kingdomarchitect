import type { UIBackground } from "../uiBackground.js";
import { createComponent, type ComponentDescriptor } from "./ui.js";

export type UiButtonProps = {
    child?: ComponentDescriptor;
    width: number;
    height: number;
    background?: UIBackground;
    padding?: number;
    onTap?: () => void;
};

export const uiButton = createComponent<UiButtonProps>(
    ({ props, withDraw, measureDescriptor, constraints, withGesture }) => {
        // Handle tap events using the new gesture system
        if (props.onTap) {
            withGesture("tap", (_event) => {
                props.onTap!();
                return true; // Event was handled
            });
        }

        withDraw((scope, region) => {
            if (props.background) {
                props.background.draw(scope, region, region);
            }
        });

        let size = { width: props.width, height: props.height };
        const padding = props.padding ?? 0;

        const constraintsWithPadding = {
            width: constraints.width - padding * 2,
            height: constraints.height - padding * 2,
        };

        let child;
        if (props.child) {
            const childSize = measureDescriptor(
                "child",
                props.child,
                constraintsWithPadding,
            );

            child = {
                ...props.child,
                offset: { x: padding, y: padding },
            };
        }

        return {
            children: child ? [child] : [],
            size,
        };
    },
    { displayName: "UiButton" },
);
