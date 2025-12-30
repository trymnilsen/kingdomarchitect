import type { UIBackground } from "../uiBackground.ts";
import { wrapUiSize, zeroSize, type UISize } from "../uiSize.ts";
import {
    createComponent,
    type ComponentDescriptor,
    type PlacedChild,
} from "./ui.ts";

export type UiButtonProps = {
    child?: ComponentDescriptor;
    width: number;
    height: number;
    background?: UIBackground;
    pressedBackground?: UIBackground;
    padding?: number;
    onTap?: () => void;
    key?: string | number;
};

export const uiButton = createComponent<UiButtonProps>(
    ({
        props,
        withDraw,
        measureDescriptor,
        constraints,
        withGesture,
        withState,
    }) => {
        const [pressedState, setPressedState] = withState(false);
        // Handle tap events using the new gesture system
        if (props.onTap) {
            withGesture("tap", (_event) => {
                props.onTap!();
                return true; // Event was handled
            });
            withGesture("tapDown", (_event) => {
                console.log("down!");
                setPressedState(true);
                return true;
            });
            withGesture("tapUp", (_event) => {
                setPressedState(false);
                return true;
            });
            withGesture("tapCancel", (_event) => {
                setPressedState(false);
                return true;
            });
        }

        withDraw((scope, region) => {
            if (props.pressedBackground && pressedState) {
                props.pressedBackground.draw(scope, region, region);
            } else if (props.background) {
                props.background.draw(scope, region, region);
            }
        });

        let size = { width: constraints.width, height: constraints.height };
        if (props.width >= 0) {
            size.width = props.width;
        }
        if (props.height >= 0) {
            size.height = props.height;
        }

        const padding = props.padding ?? 0;

        const constraintsWithPadding = {
            width: Math.max(0, size.width - padding * 2),
            height: Math.max(0, size.height - padding * 2),
        };

        let child: PlacedChild | undefined;
        if (props.child) {
            const childSize = measureDescriptor(
                "child",
                props.child,
                constraintsWithPadding,
            );

            // Center the child within the button
            const centerX = Math.floor(
                padding + (constraintsWithPadding.width - childSize.width) / 2,
            );
            const centerY = Math.floor(
                padding +
                    (constraintsWithPadding.height - childSize.height) / 2,
            );

            child = {
                ...props.child,
                offset: { x: centerX, y: centerY },
                size: childSize,
            };

            if (props.width === wrapUiSize) {
                size.width = childSize.width + padding * 2;
            }

            if (props.height === wrapUiSize) {
                size.height = childSize.height + padding * 2;
            }
        }

        return {
            children: child ? [child] : [],
            size: size,
        };
    },
    { displayName: "UiButton" },
);
