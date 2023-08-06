import { Point } from "../../common/point.js";
import { Sides } from "../../common/sides.js";
import { TextStyle } from "../../rendering/text/textStyle.js";
import { UIText } from "../view/uiText.js";
import { UIViewProperties } from "./uiViewDsl.js";

export interface UITextProperties extends UIViewProperties {
    text: string;
    style?: TextStyle;
    alignment?: Point;
    padding?: Sides;
    wrap?: boolean;
}

export function uiText(textProperties: UITextProperties): UIText {
    const text = new UIText({
        width: textProperties.width,
        height: textProperties.height,
    });

    text.text = textProperties.text;

    if (textProperties.wrap) {
        text.wrapText = textProperties.wrap;
    }

    if (textProperties.style) {
        text.textStyle = textProperties.style;
    }

    if (textProperties.id) {
        text.id = textProperties.id;
    }

    if (textProperties.alignment) {
        text.alignment = textProperties.alignment;
    }

    if (textProperties.padding) {
        text.padding = textProperties.padding;
    }

    return text;
}
