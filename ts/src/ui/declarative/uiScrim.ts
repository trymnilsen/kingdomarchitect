import { createComponent } from "./ui.ts";

type UiScrimProps = {
    color: string;
    key?: string | number;
};

/**
 * A dimming overlay that fills the available space with a translucent color.
 *
 * The scrim is intentionally NOT an interactive hit-test target: taps on it
 * fall through the declarative UI so the interaction layer can treat them as
 * a tap on the modal backdrop and pop the state. Do not give it a pointer
 * state or tap handler — that would absorb the tap and break dismissal.
 */
export const uiScrim = createComponent<UiScrimProps>(
    ({ props, withDraw, constraints }) => {
        withDraw((scope, region) => {
            scope.drawScreenSpaceRectangle({
                x: region.x,
                y: region.y,
                width: region.width,
                height: region.height,
                fill: props.color,
            });
        });

        return {
            children: [],
            size: constraints,
        };
    },
    { displayName: "UiScrim" },
);
