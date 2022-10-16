import { Point } from "../../common/point";
import { Sides } from "../../common/sides";
import { UIBackground } from "../uiBackground";
import { UIView } from "../uiView";
import { UIBox } from "../view/uiBox";
import { UIViewProperties } from "./uiViewDsl";

export interface UIBoxProperties extends UIViewProperties {
    alignment?: Point;
    background?: UIBackground;
    padding?: Sides;
    children?: UIView[];
}

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
