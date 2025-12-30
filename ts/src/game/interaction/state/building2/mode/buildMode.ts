import { Point } from "../../../../../common/point.ts";

export type BuildMode = {
    readonly description: BuildModeDescription;
    setSelection(point: Point): void;
    getSelection(): Point[];
    cursorSelection(): Point;
};

export type BuildModeDescription = {
    readonly name: string;
};
