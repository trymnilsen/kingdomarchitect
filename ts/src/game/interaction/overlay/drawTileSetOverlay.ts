import type { Bounds } from "../../../common/bounds.ts";
import { Direction } from "../../../common/direction.ts";
import { decodePosition, type Point } from "../../../common/point.ts";
import { tileBoundarySides } from "../../../common/tileBoundarySides.ts";
import type { RenderScope } from "../../../rendering/renderScope.ts";
import { TileSize } from "../../map/tile.ts";

const boundaryWidth = 2;

/**
 * Wash a set of tiles in colour and outline the shape they make. Only
 * outward-facing edges are drawn, so no later tile's fill paints over a line
 */
export function drawTileSetOverlay(
    renderScope: RenderScope,
    tiles: ReadonlySet<number>,
    fillColor: string,
    boundaryColor: string,
): void {
    const viewport = renderScope.camera.tileSpaceViewPort;
    for (const encodedTile of tiles) {
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
        for (const side of tileBoundarySides(tiles, tile)) {
            drawSide(renderScope, screen, side, boundaryColor);
        }
    }
}

/** Padded by one tile so a tile at the screen edge still draws its visible part */
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
    color: string,
): void {
    const left = screen.x;
    const top = screen.y;
    const right = screen.x + TileSize;
    const bottom = screen.y + TileSize;
    switch (side) {
        case Direction.Up:
            renderScope.drawLine(left, top, right, top, color, boundaryWidth);
            break;
        case Direction.Down:
            renderScope.drawLine(
                left,
                bottom,
                right,
                bottom,
                color,
                boundaryWidth,
            );
            break;
        case Direction.Left:
            renderScope.drawLine(left, top, left, bottom, color, boundaryWidth);
            break;
        case Direction.Right:
            renderScope.drawLine(
                right,
                top,
                right,
                bottom,
                color,
                boundaryWidth,
            );
            break;
    }
}
