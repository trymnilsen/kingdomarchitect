import { UIView } from "../uiView.js";
import { UIStack } from "../view/uiStack.js";
import { UIViewProperties } from "./uiViewDsl.js";

export type UIStackProperties = {
    children: UIView[];
} & UIViewProperties;

export function uiStack(properties: UIStackProperties): UIStack {
    const view = new UIStack({
        width: properties.width,
        height: properties.height,
    });

    for (const child of properties.children) {
        view.addView(child);
    }

    return view;
}
