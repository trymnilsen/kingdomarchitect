import { Point } from "../../../common/point.ts";

export type SelectionMode = {
    readonly description: SelectionModeDescription;
    setSelection(point: Point): void;
    getSelection(): Point[];
    cursorSelection(): Point;
};

export type SelectionModeDescription = {
    readonly name: string;
};
