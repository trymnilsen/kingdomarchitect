import { allDirections, type Direction } from "./direction.ts";
import { adjacentPoint, encodePosition, type Point } from "./point.ts";

/**
 * The sides of a tile that face out of a region: each cardinal direction
 * where the neighbour is not in the set. A tile fully inside the region has
 * none. Tiles are the packed ids from encodePosition.
 */
export function tileBoundarySides(
    tiles: ReadonlySet<number>,
    tile: Point,
): Direction[] {
    const sides: Direction[] = [];
    for (const side of allDirections) {
        const neighbour = adjacentPoint(tile, side);
        if (!tiles.has(encodePosition(neighbour.x, neighbour.y))) {
            sides.push(side);
        }
    }
    return sides;
}
