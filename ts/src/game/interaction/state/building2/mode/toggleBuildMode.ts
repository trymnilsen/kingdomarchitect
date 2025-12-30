import { Point } from "../../../../../common/point.ts";
import { BuildMode, BuildModeDescription } from "./buildMode.ts";

export class ToggleBuildMode implements BuildMode {
    get description(): BuildModeDescription {
        return toggleBuildModeDescription;
    }
    cursorSelection(): Point {
        throw new Error("Method not implemented.");
    }
    setSelection(): void {
        throw new Error("Method not implemented.");
    }
    getSelection(): Point[] {
        throw new Error("Method not implemented.");
    }
}

export const toggleBuildModeDescription = {
    name: "Toggle",
};
