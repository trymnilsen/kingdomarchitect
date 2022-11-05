import { Point } from "../../../../common/point";
import { Actor } from "../../../actor/actor";
import { GroundTile } from "../../../entity/ground";

/**
 * Class wrapping items that can be selected. Different types of items
 * Like actors (a fox or a knight) or trees.
 */
export interface SelectedItem {
    /**
     * The current position of the item that is selected.
     * Will be updated if the selected item moves.
     */
    get tilePosition(): Point;
    /**
     * Checks if the two items, the item wrapped by this class and the
     * new item are refering to the same item. This check will be different
     * based on the currently selected type. E.g selections might stretch across
     * multiple tiles
     * @param item the other item to check if is the selected item
     */
    isSelectedItem(item: any): boolean;
}

export class TileSelectedItem implements SelectedItem {
    constructor(private item: GroundTile) {}

    get tile(): GroundTile {
        return this.item;
    }

    get tilePosition(): Point {
        return {
            x: this.item.tileX,
            y: this.item.tileY,
        };
    }

    isSelectedItem(item: any): boolean {
        return item == this.item;
    }
}

export class ActorSelectedItem implements SelectedItem {
    constructor(private item: Actor) {}
    get tilePosition(): Point {
        return this.item.tilePosition;
    }
    isSelectedItem(item: any): boolean {
        return this.item == item;
    }
}
