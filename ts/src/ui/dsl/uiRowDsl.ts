import { VerticalAlignment } from "../uiAlignment.js";
import { UIView } from "../uiView.js";
import { UIRow } from "../view/uiRow.js";
import { UIViewProperties } from "./uiViewDsl.js";

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
