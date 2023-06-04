import { Point } from "../../../../../common/point";
import { BuildMode, BuildModeDescription } from "./buildMode";

export class SingleBuildMode implements BuildMode {
    private currentSelection: Point;

    constructor(selection: Point) {
        this.currentSelection = selection;
    }

    get description(): BuildModeDescription {
        return singleBuildModeDescription;
    }
    cursorSelection(): Point {
        return this.currentSelection;
    }
    setSelection(point: Point): void {
        this.currentSelection = point;
    }
    getSelection(): Point[] {
        return [this.currentSelection];
    }
}

export const singleBuildModeDescription = {
    name: "Single",
};
