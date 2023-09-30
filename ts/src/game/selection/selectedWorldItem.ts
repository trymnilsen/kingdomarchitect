import { Point } from "../../common/point.js";

/**
 * Class wrapping items that can be selected. Different types of items
 * like a position for tile or an instance of an entity
 */
export interface SelectedWorldItem {
    /**
     * The current position of the item that is selected.
     * Will be updated if the selected item moves.
     */
    get tilePosition(): Point;
    get selectionSize(): Point;
    /**
     * Checks if the two items, the item wrapped by this class and the
     * new item are refering to the same item. This check will be different
     * based on the currently selected type. E.g selections might stretch across
     * multiple tiles
     * @param item the other item to check if is the selected item
     */
    isSelectedItem(item: unknown): boolean;
}
