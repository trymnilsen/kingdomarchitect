import { UIText } from "../view/uiText.js";
export function uiText(textProperties) {
    const text = new UIText({
        width: textProperties.width,
        height: textProperties.height
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
    if (textProperties.padding) {
        text.padding = textProperties.padding;
    }
    return text;
}
