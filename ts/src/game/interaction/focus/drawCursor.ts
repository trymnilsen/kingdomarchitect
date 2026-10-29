import { spriteRefs, type SpriteRef } from "../../../asset/sprite.ts";
import type { Bounds } from "../../../common/bounds.ts";
import { allSides } from "../../../common/sides.ts";
import type { RenderScope } from "../../../rendering/renderScope.ts";
import { TileSize } from "../../map/tile.ts";
import type { WorldSelection } from "../selection/selectedWorldItem.ts";

/**
 * Draw the frame around what the current state has picked in the world. Green
 * when the pick is usable, red when it is not, for example a tapped tile with
 * nothing to attack. The interaction handler is the only caller, so every
 * state's selection looks the same.
 */
export function drawSelectionCursor(
    context: RenderScope,
    selection: WorldSelection,
): void {
    const screenPosition = context.camera.tileSpaceToScreenSpace(
        selection.tilePosition,
    );
    drawCursorFrame(
        context,
        selection.isValid ? spriteRefs.cursor : spriteRefs.cursor_red,
        {
            x1: screenPosition.x,
            y1: screenPosition.y,
            x2: screenPosition.x + selection.selectionSize.x * TileSize,
            y2: screenPosition.y + selection.selectionSize.y * TileSize,
        },
    );
}

/**
 * Draw the frame around the HUD element that has keyboard focus. It pulses
 * with the draw tick so it reads as "where the keys go" rather than as a
 * selection, which keeps still.
 */
export function drawFocusCursor(context: RenderScope, bounds: Bounds): void {
    const pulse = context.drawTick % 2 == 0 ? 2 : 0;
    drawCursorFrame(context, spriteRefs.cursor, {
        x1: bounds.x1 - pulse,
        y1: bounds.y1 - pulse,
        x2: bounds.x2 + pulse,
        y2: bounds.y2 + pulse,
    });
}

function drawCursorFrame(
    context: RenderScope,
    sprite: SpriteRef,
    bounds: Bounds,
): void {
    context.drawNinePatchSprite({
        sprite,
        x: bounds.x1,
        y: bounds.y1,
        width: bounds.x2 - bounds.x1,
        height: bounds.y2 - bounds.y1,
        scale: 1.0,
        sides: allSides(12.0),
    });
}
