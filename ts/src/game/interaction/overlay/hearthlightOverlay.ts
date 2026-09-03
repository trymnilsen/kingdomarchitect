import type { Bounds } from "../../../common/bounds.ts";
import { Direction } from "../../../common/direction.ts";
import { decodePosition, type Point } from "../../../common/point.ts";
import { tileBoundarySides } from "../../../common/tileBoundarySides.ts";
import type { RenderScope } from "../../../rendering/renderScope.ts";
import type { Entity } from "../../entity/entity.ts";
import { computeHearthlight } from "../../light/hearthlight.ts";
import { TileSize } from "../../map/tile.ts";

const fillColor = "rgba(255, 221, 0, 0.12)";
const boundaryColor = "rgba(255, 221, 0, 0.9)";
const boundaryWidth = 2;

/**
 * A faint wash over every hearthlight tile and a solid line along the
 * boundary, which is where hostiles stop being targeted and defenders stop
 * pursuing. The lit set is rebuilt from the entity tree every frame; if that
 * ever shows in a profile, lightClaims.ts describes how to cache it.
 */
export function drawHearthlightOverlay(
    root: Entity,
    renderScope: RenderScope,
): void {
    const hearthlight = computeHearthlight(root);
    const viewport = renderScope.camera.tileSpaceViewPort;
    for (const encodedTile of hearthlight) {
        const tile = decodePosition(encodedTile);
        if (!isNearViewport(tile, viewport)) {
            continue;
        }
        const screen = renderScope.camera.tileSpaceToScreenSpace(tile);
        renderScope.drawScreenSpaceRectangle({
            x: screen.x,
            y: screen.y,
            width: TileSize,
            height: TileSize,
            fill: fillColor,
        });
        // A line only exists where the neighbour is unlit, so no later
        // tile's fill can paint over it.
        for (const side of tileBoundarySides(hearthlight, tile)) {
            drawSide(renderScope, screen, side);
        }
    }
}

/**
 * Pads the viewport by one tile so a tile just past the screen edge still
 * draws the part of its square that lands on screen.
 */
function isNearViewport(tile: Point, viewport: Bounds): boolean {
    return (
        tile.x >= viewport.x1 - 1 &&
        tile.x <= viewport.x2 + 1 &&
        tile.y >= viewport.y1 - 1 &&
        tile.y <= viewport.y2 + 1
    );
}

function drawSide(
    renderScope: RenderScope,
    screen: Point,
    side: Direction,
): void {
    const left = screen.x;
    const top = screen.y;
    const right = screen.x + TileSize;
    const bottom = screen.y + TileSize;
    const color = boundaryColor;
    const width = boundaryWidth;
    switch (side) {
        case Direction.Up:
            renderScope.drawLine(left, top, right, top, color, width);
            break;
        case Direction.Down:
            renderScope.drawLine(left, bottom, right, bottom, color, width);
            break;
        case Direction.Left:
            renderScope.drawLine(left, top, left, bottom, color, width);
            break;
        case Direction.Right:
            renderScope.drawLine(right, top, right, bottom, color, width);
            break;
    }
}
