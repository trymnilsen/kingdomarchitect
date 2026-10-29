import { type Point } from "../../../common/point.ts";
import {
    type SelectionMode,
    type SelectionModeDescription,
} from "./selectionMode.ts";

/**
 * Selects every tile in the box between a fixed corner and the last point
 * pressed. The corner stays put so each press, or each arrow key moving the
 * other corner, resizes the box instead of starting a new one.
 */
export class BoxSelectionMode implements SelectionMode {
    private anchor: Point;
    private end: Point;
    private selection: Point[] = [];

    constructor(initialPoint: Point) {
        this.anchor = initialPoint;
        this.end = initialPoint;
        this.selection = [initialPoint];
    }

    get description(): SelectionModeDescription {
        return {
            name: "Box",
        };
    }

    cursorSelection(): Point {
        return this.end;
    }

    setSelection(point: Point): void {
        const startX = Math.min(point.x, this.anchor.x);
        const startY = Math.min(point.y, this.anchor.y);
        const xRange = Math.abs(point.x - this.anchor.x);
        const yRange = Math.abs(point.y - this.anchor.y);

        const positions: Point[] = [];
        for (let x = 0; x <= xRange; x++) {
            for (let y = 0; y <= yRange; y++) {
                positions.push({
                    x: startX + x,
                    y: startY + y,
                });
            }
        }

        this.selection = positions;
        this.end = point;
    }

    getSelection(): Point[] {
        return this.selection;
    }
}
