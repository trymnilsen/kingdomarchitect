import { Point } from "../../../../../common/point";

export interface BuildMode {
    readonly description: BuildModeDescription;
    setSelection(point: Point): void;
    getSelection(): Point[];
    cursorSelection(): Point;
}

export interface BuildModeDescription {
    readonly name: string;
}
