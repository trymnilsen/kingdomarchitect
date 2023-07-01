import { Point } from "../../../../../common/point.js";
import { BuildMode, BuildModeDescription } from "./buildMode.js";

export class ToggleBuildMode implements BuildMode {
    get description(): BuildModeDescription {
        return toggleBuildModeDescription;
    }
    cursorSelection(): Point {
        throw new Error("Method not implemented.");
    }
    setSelection(point: Point): void {
        throw new Error("Method not implemented.");
    }
    getSelection(): Point[] {
        throw new Error("Method not implemented.");
    }
}

export const toggleBuildModeDescription = {
    name: "Toggle",
};