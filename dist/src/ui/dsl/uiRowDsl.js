import { UIRow } from "../view/uiRow.js";
export function uiRow(rowProperties) {
    const row = new UIRow({
        width: rowProperties.width,
        height: rowProperties.height
    });
    if (rowProperties.verticalAlignment) {
        row.verticalAlignment = rowProperties.verticalAlignment;
    }
    if (rowProperties.id) {
        row.id = rowProperties.id;
    }
    for (const item of rowProperties.children){
        row.addView(item.child, item.weight);
    }
    return row;
}
