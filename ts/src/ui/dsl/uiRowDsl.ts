import { VerticalAlignment } from "../uiAlignment";
import { UIView } from "../uiView";
import { UIRow } from "../view/uiRow";
import { UIViewProperties } from "./uiViewDsl";

export interface RowChild {
    child: UIView;
    weight?: number;
}

export interface UIColumnProperties extends UIViewProperties {
    verticalAlignment?: VerticalAlignment;
    children: RowChild[];
}

export function uiRow(rowProperties: UIColumnProperties): UIRow {
    const row = new UIRow({
        width: rowProperties.width,
        height: rowProperties.height,
    });

    if (rowProperties.verticalAlignment) {
        row.verticalAlignment = rowProperties.verticalAlignment;
    }

    if (rowProperties.id) {
        row.id = rowProperties.id;
    }

    for (const item of rowProperties.children) {
        row.addView(item.child, item.weight);
    }

    return row;
}
