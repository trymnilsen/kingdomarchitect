import type { Point } from "../../../../common/point.ts";
import type { GroundTile } from "../../../map/tile.ts";
import { type FocusDomain, worldFirstFocus } from "../../focus/focusDomain.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    tileWorldSelection,
    type WorldSelection,
} from "../../selection/selectedWorldItem.ts";

/**
 * Base for states where the player aims at a tile in the world, such as picking
 * an attack target or where a worker should walk. The aimed-at tile is the
 * state's world selection, so the handler draws it like any other selection,
 * the keys move it like any other focus, and subclasses only decide what a pick
 * means and whether it is usable.
 *
 * Subclasses implement onPick rather than overriding onTilePress, which would
 * leave the picked tile, and so the cursor, behind.
 */
export abstract class CursorSelectionBaseState extends InteractionState {
    private _pickedTile: Point | null = null;

    /** The tile last aimed at. Null until the player picks one. */
    protected get pickedTile(): Point | null {
        return this._pickedTile;
    }

    override get focusDomains(): readonly FocusDomain[] {
        return worldFirstFocus;
    }

    override getWorldSelection(): WorldSelection | null {
        if (!this._pickedTile) {
            return null;
        }
        return tileWorldSelection(this._pickedTile, this.isPickValid());
    }

    override onTilePress(position: Point, ground: GroundTile | null): boolean {
        this._pickedTile = position;
        return this.onPick(position, ground);
    }

    /**
     * Work out what aiming at this tile means for the state.
     * @returns whether the press was taken, as for onTilePress
     */
    protected abstract onPick(
        position: Point,
        ground: GroundTile | null,
    ): boolean;

    /** Whether the current pick can be acted on. Drawn red when it can't. */
    protected abstract isPickValid(): boolean;
}
