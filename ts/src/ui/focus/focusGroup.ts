import { Bounds } from "../../common/bounds.ts";
import { Direction } from "../../common/direction.ts";

export type FocusGroup = {
    getFocusBounds(): Bounds | null;
    moveFocus(direction: Direction, currentFocusBounds: Bounds | null): boolean;
    onFocusActionInput(): boolean;
};
