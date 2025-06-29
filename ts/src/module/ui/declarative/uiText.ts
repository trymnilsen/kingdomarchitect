import type { TextStyle } from "../../../rendering/text/textStyle.js";
import { createComponent } from "./ui.js";

export type UiTextProps = {
    content: string;
    textStyle: TextStyle;
};
export const uiText = createComponent<UiTextProps>(
    ({ props, withDraw, measureText }) => {
        withDraw((context, region) => {
            context.drawScreenspaceText({
                text: props.content,
                font: props.textStyle.font,
                size: props.textStyle.size,
                color: props.textStyle.color,
                x: region.x,
                y: region.y,
            });
        });

        const size = measureText(props.content, props.textStyle);

        return {
            children: [],
            size: size,
        };
    },
);
