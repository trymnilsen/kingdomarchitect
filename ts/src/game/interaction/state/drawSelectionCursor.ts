import { spriteRefs } from "../../../asset/sprite.ts";
import { allSides } from "../../../common/sides.ts";
import type { Point } from "../../../common/point.ts";
import type { RenderScope } from "../../../rendering/renderScope.ts";
import { TileSize } from "../../map/tile.ts";

/**
 * Draw the tile-selection cursor used by the actor-targeting states. Green when
 * a valid target is selected, red when the tapped tile has none. Draws nothing
 * when no tile has been tapped yet. Shared by the attack and equip selection
 * states so the cursor looks and behaves identically in both.
 */
export function drawSelectionCursor(
    context: RenderScope,
    selectedPoint: Point | null,
    hasSelection: boolean,
): void {
    if (!selectedPoint) {
        return;
    }
    const cursorWorldPosition =
        context.camera.tileSpaceToScreenSpace(selectedPoint);
    context.drawNinePatchSprite({
        sprite: hasSelection ? spriteRefs.cursor : spriteRefs.cursor_red,
        height: TileSize,
        width: TileSize,
        scale: 1.0,
        sides: allSides(12.0),
        x: cursorWorldPosition.x,
        y: cursorWorldPosition.y,
    });
}
