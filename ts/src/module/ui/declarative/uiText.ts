import type { TextStyle } from "../../../rendering/text/textStyle.js";
import { createUiComponent } from "./component.js";
import { setLayout } from "./layout.js";

export type UiTextProps = {
    content: string;
    textStyle: TextStyle;
};
export const uiText = createUiComponent<UiTextProps>(
    ({ props, withLayout: useLayout, withDraw: useDraw }) => {
        useLayout((constraints, _node, _layout, measure) => {
            const textSize = measure.measureText(
                props.content,
                props.textStyle,
            );
            const size = {
                width: Math.floor(Math.min(textSize.width, constraints.width)),
                height: Math.floor(
                    Math.min(textSize.height, constraints.height),
                ),
            };

            return size;
        });

        useDraw((context, region) => {
            context.drawScreenspaceText({
                text: props.content,
                font: props.textStyle.font,
                size: props.textStyle.size,
                color: props.textStyle.color,
                x: region.x,
                y: region.y,
            });
        });
    },
);
