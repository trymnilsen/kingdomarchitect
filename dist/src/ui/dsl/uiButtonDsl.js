import { UIButton } from "../view/uiButton.js";
export function uiButton(properties) {
    const button = new UIButton({
        width: properties.width,
        height: properties.height
    });
    if (properties.padding) {
        button.padding = properties.padding;
    }
    if (properties.id) {
        button.id = properties.id;
    }
    if (properties.alignment) {
        button.alignment = properties.alignment;
    }
    if (properties.defaultBackground) {
        button.defaultBackground = properties.defaultBackground;
    }
    if (properties.onTappedBackground) {
        button.onTappedBackground = properties.onTappedBackground;
    }
    if (properties.onTapCallback) {
        button.onTapCallback = properties.onTapCallback;
    }
    if (properties.children) {
        for (const child of properties.children){
            button.addView(child);
        }
    }
    return button;
}
