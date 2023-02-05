import { HorizontalAlignment } from "../uiAlignment";
import { UIView } from "../uiView";
import { UIColumn } from "../view/uiColumn";
import { UIViewProperties } from "./uiViewDsl";

export interface ColumnChild {
    child: UIView;
    weight?: number;
}

export interface UIColumnProperties extends UIViewProperties {
    horizontalAlignment?: HorizontalAlignment;
    children: ColumnChild[];
    weights?: { [viewId: string]: number };
}

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
