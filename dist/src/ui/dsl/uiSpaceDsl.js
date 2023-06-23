import { UISpace } from "../view/uiSpace.js";
export function uiSpace(properties) {
    const spacer = new UISpace({
        width: properties.width,
        height: properties.height
    });
    if (properties.id) {
        spacer.id = properties.id;
    }
    return spacer;
}
