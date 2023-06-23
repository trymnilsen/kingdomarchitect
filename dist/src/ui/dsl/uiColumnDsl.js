import { UIColumn } from "../view/uiColumn.js";
export function uiColumn(columnProperties) {
    const column = new UIColumn({
        width: columnProperties.width,
        height: columnProperties.height
    });
    if (columnProperties.horizontalAlignment) {
        column.horizontalAlignment = columnProperties.horizontalAlignment;
    }
    if (columnProperties.id) {
        column.id = columnProperties.id;
    }
    for (const item of columnProperties.children){
        column.addView(item.child, item.weight);
    }
    return column;
}
