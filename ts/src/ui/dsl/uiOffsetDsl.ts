import { Point } from "../../common/point";
import { UIView } from "../uiView";
import { UIOffset } from "../view/uiOffset";
import { UIViewProperties } from "./uiViewDsl";

export interface UIOffsetProperties extends UIViewProperties {
    layoutOffset: Point;
    children: UIView[];
}

export function uiOffset(uiOffsetProperties: UIOffsetProperties): UIOffset {
    const view = new UIOffset({
        width: uiOffsetProperties.width,
        height: uiOffsetProperties.height,
    });

    view.layoutOffset = uiOffsetProperties.layoutOffset;

    for (const child of uiOffsetProperties.children) {
        view.addView(child);
    }
    return view;
}
