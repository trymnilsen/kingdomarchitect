import { Point, manhattanPath } from "../../../../../common/point.js";
import { BuildMode, BuildModeDescription } from "./buildMode.js";

export class LineBuildMode implements BuildMode {
    private from: Point;
    private selection: Point[] = [];

    constructor(initialPoint: Point) {
        this.from = initialPoint;
        this.selection = [initialPoint];
    }

    get description(): BuildModeDescription {
        return boxBuildModeDescription;
    }
    cursorSelection(): Point {
        return this.selection[this.selection.length - 1];
    }
    setSelection(point: Point): void {
        const path = manhattanPath(this.from, point);
        if (path.length == 0) {
            return;
        }

        this.selection = path;
        this.from = point;
    }
    getSelection(): Point[] {
        return this.selection;
    }
}

export const boxBuildModeDescription = {
    name: "Line",
};
