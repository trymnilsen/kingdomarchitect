import { Point, pointEquals } from "../../../common/point.js";
import { SelectionMode, SelectionModeDescription } from "./selectionMode.js";

export class BoxSelectionMode implements SelectionMode {
    private from: Point;
    private selection: Point[] = [];

    constructor(initialPoint: Point) {
        this.from = initialPoint;
        this.selection = [initialPoint];
    }

    get description(): SelectionModeDescription {
        return {
            name: "Box",
        };
    }

    cursorSelection(): Point {
        return this.from;
    }

    setSelection(point: Point): void {
        if (pointEquals(this.from, point)) {
            return;
        }

        const xRange = Math.abs(point.x - this.from.x);
        const yRange = Math.abs(point.y - this.from.y);
        const startX = Math.min(point.x, this.from.x);
        const startY = Math.min(point.y, this.from.y);

        const positions: Point[] = [];
        console.log("SetSelection", this.from, point, xRange, yRange);
        for (let x = 0; x <= xRange; x++) {
            for (let y = 0; y <= yRange; y++) {
                positions.push({
                    x: startX + x,
                    y: startY + y,
                });
            }
        }

        this.selection = positions;
        this.from = point;
    }
    getSelection(): Point[] {
        return this.selection;
    }
}
