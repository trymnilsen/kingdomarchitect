import { Point, pointEquals } from "../../../../../common/point";
import { BuildMode, BuildModeDescription } from "./buildMode";

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
        if (pointEquals(this.from, point)) {
            return;
        }

        const xRange = point.x - this.from.x;
        const yRange = point.y - this.from.y;
        const positions: Point[] = [];
        console.log("SetSelection", this.from, point, xRange, yRange);
        // 1 is subtracted from the range to avoid pushing a duplicate
        // position where the horizontal line (made here) and the
        // vertical lines meet
        for (let x = 0; x < Math.abs(xRange); x++) {
            let direction = 1;
            if (xRange < 0) {
                direction = -1;
            }

            const xPosition = this.from.x + x * direction;
            positions.push({
                x: xPosition,
                y: this.from.y,
            });
        }

        for (let y = 0; y < Math.abs(yRange); y++) {
            let direction = 1;
            if (yRange < 0) {
                direction = -1;
            }

            const yPosition = this.from.y + y * direction;
            positions.push({
                x: point.x,
                y: yPosition,
            });
        }

        positions.push(point);

        this.selection = positions;
        this.from = point;
    }
    getSelection(): Point[] {
        return this.selection;
    }
}

export const boxBuildModeDescription = {
    name: "Line",
};
