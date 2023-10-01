import { Point } from "../../../../../common/point.js";
import { BuildMode, BuildModeDescription } from "./buildMode.js";

export class BoxBuildMode implements BuildMode {
    get description(): BuildModeDescription {
        return boxBuildModeDescription;
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

export const boxBuildModeDescription = {
    name: "Box",
};
