import { Point } from "../../../../../common/point.js";

export type BuildMode = {
    readonly description: BuildModeDescription;
    setSelection(point: Point): void;
    getSelection(): Point[];
    cursorSelection(): Point;
}

export type BuildModeDescription = {
    readonly name: string;
}
