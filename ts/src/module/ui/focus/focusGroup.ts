import { Bounds } from "../../../common/bounds.js";
import { Direction } from "../../../common/direction.js";

export type FocusGroup = {
    getFocusBounds(): Bounds | null;
    moveFocus(direction: Direction, currentFocusBounds: Bounds | null): boolean;
    onFocusActionInput(): boolean;
};
