import { Point } from "../../../common/point.js";

export interface SelectionMode {
    readonly description: SelectionModeDescription;
    setSelection(point: Point): void;
    getSelection(): Point[];
    cursorSelection(): Point;
}

export interface SelectionModeDescription {
    readonly name: string;
}
