import { UIBox } from "../view/uiBox.js";
export function uiBox(uiBoxProperties) {
    const box = new UIBox({
        width: uiBoxProperties.width,
        height: uiBoxProperties.height
    });
    if (uiBoxProperties.id) {
        box.id = uiBoxProperties.id;
    }
    if (uiBoxProperties.alignment) {
        box.alignment = uiBoxProperties.alignment;
    }
    if (uiBoxProperties.background) {
        box.background = uiBoxProperties.background;
    }
    if (uiBoxProperties.padding) {
        box.padding = uiBoxProperties.padding;
    }
    if (uiBoxProperties.children) {
        for (const child of uiBoxProperties.children){
            box.addView(child);
        }
    }
    return box;
}
