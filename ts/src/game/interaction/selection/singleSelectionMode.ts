import { Point } from "../../../common/point.ts";
import { SelectionMode, SelectionModeDescription } from "./selectionMode.ts";

export class SingleSelectionMode implements SelectionMode {
    private currentSelection: Point;

    constructor(selection: Point) {
        this.currentSelection = selection;
    }

    get description(): SelectionModeDescription {
        return {
            name: "Single",
        };
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
