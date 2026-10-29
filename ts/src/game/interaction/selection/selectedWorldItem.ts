import { type Point } from "../../../common/point.ts";

/**
 * Class wrapping items that can be selected. Different types of items
 * like a position for tile or an instance of an entity
 */
export type SelectedWorldItem = {
    /**
     * The current position of the item that is selected.
     * Will be updated if the selected item moves.
     */
    get tilePosition(): Point;
    get selectionSize(): Point;
    /**
     * Whether the other selection wraps the same thing in the world. Each
     * press makes new wrappers, so identity of the wrappers says nothing.
     */
    isSameItem(other: SelectedWorldItem): boolean;
};

/**
 * Where a state's pick in the world is right now, and whether it is usable
 * there. A worker selection is always usable while an empty tile picked as an
 * attack target is not. The same item can be valid in one state and invalid in
 * the next, so validity lives here rather than on the item.
 */
export type WorldSelection = {
    tilePosition: Point;
    selectionSize: Point;
    isValid: boolean;
};

/** A pick that is only a tile position, such as a spot with no land on it. */
export function tileWorldSelection(
    tilePosition: Point,
    isValid: boolean,
): WorldSelection {
    return {
        tilePosition,
        selectionSize: { x: 1, y: 1 },
        isValid,
    };
}
