import { sprites } from "../../asset/sprite";
import { Bounds, getBoundsAxis } from "../../common/bounds";
import { Axis, Direction } from "../../common/direction";
import { adjacentPoint, Point } from "../../common/point";
import { NumberRange, rangeDistance, rangeRandom } from "../../common/range";
import { RenderContext } from "../../rendering/renderContext";
import { getTileId, TileSize } from "./tile";

export interface GroundTile {
    tileX: number;
    tileY: number;
    hasTree?: boolean;
}

export class Ground {
    private tiles: { [id: string]: GroundTile } = {};
    constructor() {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const id = getTileId(x, y);
                this.tiles[id] = {
                    tileX: x,
                    tileY: y,
                    hasTree: Math.random() > 0.9,
                };
            }
        }
    }

    getBounds(): Bounds {
        const entries = Object.entries(this.tiles);
        return getTileBounds(entries);
    }

    getTile(tilePosition: Point): GroundTile | null {
        return this.tiles[getTileId(tilePosition.x, tilePosition.y)] || null;
    }

    getTiles(predicate: (tile: GroundTile) => boolean): GroundTile[] {
        return Object.values(this.tiles).filter(predicate);
    }

    setTile(tile: GroundTile) {
        this.tiles[getTileId(tile.tileX, tile.tileY)] = tile;
    }

    generate() {
        //console.log("Generate based on current tiles", this.tiles);
        const renderStart = performance.now();
        const newTilePosition = generateGround(this.tiles);
        if (newTilePosition.x == 0 && newTilePosition.y == 0) {
            console.warn("Unable to generate tile position");
        } else {
            this.tiles[getTileId(newTilePosition.x, newTilePosition.y)] = {
                tileX: newTilePosition.x,
                tileY: newTilePosition.y,
                hasTree: Math.random() > 0.7,
            };
        }

        const renderEnd = performance.now();
        //console.log("⏱generate ground time: ", renderEnd - renderStart);
    }

    onDraw(context: RenderContext) {
        for (const tileId in this.tiles) {
            const tile = this.tiles[tileId];
            context.drawRectangle({
                x: tile.tileX * TileSize,
                y: tile.tileY * TileSize,
                width: TileSize - 2,
                height: TileSize - 2,
                fill: "green",
            });

            if (tile.hasTree) {
                context.drawSprite({
                    sprite: sprites.tree,
                    x: tile.tileX * TileSize + 4,
                    y: tile.tileY * TileSize,
                });
            }
        }
    }
}

const LEFT_SIDE = 0;
const TOP_SIDE = 1;
const RIGHT_SIDE = 2;
const BOTTOM_SIDE = 3;

export function getTileBounds(entries: [string, GroundTile][]): Bounds {
    const bounds = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    };
    if (entries.length == 0) {
        return bounds;
    }
    //Set the bounds to the first entry
    const firstTile = entries[0][1];
    bounds.x1 = firstTile.tileX;
    bounds.x2 = firstTile.tileX;
    bounds.y1 = firstTile.tileY;
    bounds.y2 = firstTile.tileY;

    for (const item of entries) {
        const tile = item[1];
        if (tile.tileX < bounds.x1) {
            bounds.x1 = tile.tileX;
        }
        if (tile.tileX > bounds.x2) {
            bounds.x2 = tile.tileX;
        }
        if (tile.tileY < bounds.y1) {
            bounds.y1 = tile.tileY;
        }
        if (tile.tileY > bounds.y2) {
            bounds.y2 = tile.tileY;
        }
    }

    return bounds;
}

export function generateGround(tiles: { [id: string]: GroundTile }): Point {
    const entries = Object.entries(tiles);
    const boundsStart = performance.now();
    const bounds = getTileBounds(entries);
    const boundsEnd = performance.now();
    //console.log("⏱get bounds time: ", boundsEnd - boundsStart);
    const side = Math.floor(Math.random() * 4);

    //console.log("bounds", bounds);
    let x = 0;
    let y = 0;
    let searchDirection = Direction.Down;
    let axis = side % 2 == 0 ? Axis.YAxis : Axis.XAxis;
    let axisRange = getBoundsAxis(bounds, axis);
    //console.log("side", side);
    //console.log("axis", axis);
    //console.log("axisRange", axisRange);

    switch (side) {
        case LEFT_SIDE:
            x = bounds.x1 - 1;
            y = rangeRandom(axisRange);
            searchDirection = Direction.Right;
            break;
        case TOP_SIDE:
            x = rangeRandom(axisRange);
            y = bounds.y1 - 1;
            searchDirection = Direction.Down;
            break;
        case RIGHT_SIDE:
            x = bounds.x2 + 1;
            y = rangeRandom(axisRange);
            searchDirection = Direction.Left;
            break;
        case BOTTOM_SIDE:
            x = rangeRandom(axisRange);
            y = bounds.y2 + 1;
            searchDirection = Direction.Up;
            break;
    }
    //console.log("searchdirection: ", searchDirection);
    //console.log("x:", x);
    //console.log("y:", y);

    let tilePoint: Point = { x: 0, y: 0 };
    let lastSearchPoint = { x, y };
    //console.log("range distance", rangeDistance(axisRange));
    const searchStart = performance.now();
    for (let i = 0; i < rangeDistance(axisRange); i++) {
        const adjacent = adjacentPoint(lastSearchPoint, searchDirection);
        const tileId = getTileId(adjacent.x, adjacent.y);
        /* console.log(
            `adjacent to ${lastSearchPoint.x}/${lastSearchPoint.y} in direction ${searchDirection}`,
            adjacent,
            tileId
        ); */
        if (!!tiles[tileId]) {
            tilePoint = lastSearchPoint;
            break;
        } else {
            lastSearchPoint = adjacent;
        }
    }
    const searchEnd = performance.now();
    //console.log("⏱search tile time: ", searchEnd - searchStart);

    return tilePoint;
}
