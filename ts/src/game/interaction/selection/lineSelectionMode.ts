import { type Point, manhattanPath } from "../../../common/point.ts";
import {
    type SelectionMode,
    type SelectionModeDescription,
} from "./selectionMode.ts";

/**
 * Selects a manhattan line from a fixed start to the last point pressed. The
 * start stays put so each press, or each arrow key moving the end, redraws the
 * line to the new end instead of starting a new one from the old end.
 */
export class LineSelectionMode implements SelectionMode {
    private anchor: Point;
    private selection: Point[] = [];

    constructor(initialPoint: Point) {
        this.anchor = initialPoint;
        this.selection = [initialPoint];
    }

    get description(): SelectionModeDescription {
        return {
            name: "Line",
        };
    }

    cursorSelection(): Point {
        return this.selection[this.selection.length - 1];
    }

    setSelection(point: Point): void {
        const path = manhattanPath(this.anchor, point);
        // Pressing the start again shrinks the line back to it
        this.selection = path.length > 0 ? path : [this.anchor];
    }

    getSelection(): Point[] {
        return this.selection;
    }
}
