import { Point } from "../../../common/point.js";
import { Sides } from "../../../common/sides.js";
import { UIBackground } from "../uiBackground.js";
import { UIView } from "../uiView.js";
import { UIBox } from "../view/uiBox.js";
import { UIViewProperties } from "./uiViewDsl.js";

export type UIBoxProperties = {
    alignment?: Point;
    background?: UIBackground;
    padding?: Sides;
    children?: UIView[];
} & UIViewProperties;

export function uiBox(uiBoxProperties: UIBoxProperties): UIBox {
    const box = new UIBox({
        width: uiBoxProperties.width,
        height: uiBoxProperties.height,
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
        for (const child of uiBoxProperties.children) {
            box.addView(child);
        }
    }

    return box;
}
