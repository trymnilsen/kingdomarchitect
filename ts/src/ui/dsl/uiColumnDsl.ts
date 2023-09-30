import { HorizontalAlignment } from "../uiAlignment.js";
import { UIView } from "../uiView.js";
import { UIColumn } from "../view/uiColumn.js";
import { UIViewProperties } from "./uiViewDsl.js";

export type ColumnChild = {
    child: UIView;
    weight?: number;
}

export type UIColumnProperties = {
    horizontalAlignment?: HorizontalAlignment;
    children: ColumnChild[];
    weights?: Record<string, number>;
} & UIViewProperties

export function uiColumn(columnProperties: UIColumnProperties): UIColumn {
    const column = new UIColumn({
        width: columnProperties.width,
        height: columnProperties.height,
    });

    if (columnProperties.horizontalAlignment) {
        column.horizontalAlignment = columnProperties.horizontalAlignment;
    }

    if (columnProperties.id) {
        column.id = columnProperties.id;
    }

    for (const item of columnProperties.children) {
        column.addView(item.child, item.weight);
    }

    return column;
}
