import { UISpace } from "../view/uiSpace";
import { UIViewProperties } from "./uiViewDsl";

export function uiSpace(properties: UIViewProperties): UISpace {
    const spacer = new UISpace({
        width: properties.width,
        height: properties.height,
    });

    return spacer;
}
