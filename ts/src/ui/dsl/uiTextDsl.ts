import { Point } from "../../common/point";
import { TextStyle } from "../../rendering/text/textStyle";
import { UIText } from "../view/uiText";
import { UIViewProperties } from "./uiViewDsl";

export interface UITextProperties extends UIViewProperties {
    text: string;
    style?: TextStyle;
    alignment?: Point;
}

export function uiText(textProperties: UITextProperties): UIText {
    const text = new UIText({
        width: textProperties.width,
        height: textProperties.height,
    });

    text.text = textProperties.text;

    if (textProperties.style) {
        text.textStyle = textProperties.style;
    }

    if (textProperties.id) {
        text.id = textProperties.id;
    }

    if (textProperties.alignment) {
        text.alignment = textProperties.alignment;
    }

    return text;
}