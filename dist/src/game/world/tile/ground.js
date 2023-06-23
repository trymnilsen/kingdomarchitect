function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../asset/sprite.js";
import { randomEntry } from "../../../common/array.js";
import { getBoundsAxis } from "../../../common/bounds.js";
import { Axis, Direction, getRandomAxis, getRandomDirection, invertAxis, invertDirection } from "../../../common/direction.js";
import { adjacentPoint, pointEquals } from "../../../common/point.js";
import { rangeDistance, rangeRandom } from "../../../common/range.js";
import { getTileId, TileSize } from "./tile.js";
function hasTree(threshold) {
    if (Math.random() > threshold) {
        return Math.floor(Math.random() * 3.0) + 1;
    } else {
        return 0;
    }
}
export class Ground {
    getRandomBoundsPosition() {
        return getRandomBoundsPosition(this.tiles, 0);
    }
    getBounds() {
        const entries = Object.entries(this.tiles);
        return getTileBounds(entries);
    }
    getTile(tilePosition) {
        return this.tiles[getTileId(tilePosition.x, tilePosition.y)] || null;
    }
    getTiles(predicate) {
        return Object.values(this.tiles).filter(predicate);
    }
    setTile(tile) {
        this.tiles[getTileId(tile.tileX, tile.tileY)] = tile;
    }
    generate() {
        const chunk = generateChunk(this.chunks);
        if (!!chunk) {
            this.chunks.push(chunk);
            for(let cx = 0; cx < 3; cx++){
                for(let cy = 0; cy < 3; cy++){
                    const tilePoint = {
                        x: chunk.x * 3 + cx,
                        y: chunk.y * 3 + cy
                    };
                    this.tiles[getTileId(tilePoint.x, tilePoint.y)] = {
                        tileX: tilePoint.x,
                        tileY: tilePoint.y,
                        hasTree: hasTree(0.7)
                    };
                }
            }
            console.log("Chunk generated: ", chunk);
        } else {
            console.warn("Failed to generate tile");
        }
    }
    onDraw(context) {
        for(const tileId in this.tiles){
            const tile = this.tiles[tileId];
            context.drawRectangle({
                x: tile.tileX * TileSize,
                y: tile.tileY * TileSize,
                width: TileSize - 2,
                height: TileSize - 2,
                fill: "green"
            });
            if (tile.hasTree && tile.hasTree > 0) {
                /*
                TODO: Might not need this file anymore since the is
                let sprite = sprites.tree;
                if (tile.hasTree >= 2.0) {
                    sprite = sprites.tree2;
                }
                if (tile.hasTree >= 3.0) {
                    sprite = sprites.tree3;
                }
                */ context.drawSprite({
                    sprite: sprites2.tree_1,
                    x: tile.tileX * TileSize + 4,
                    y: tile.tileY * TileSize
                });
            }
        }
    }
    constructor(){
        _define_property(this, "tiles", {});
        _define_property(this, "chunks", []);
        this.chunks.push({
            x: 0,
            y: 0
        });
        for(let x = 0; x < 3; x++){
            for(let y = 0; y < 3; y++){
                const id = getTileId(x, y);
                this.tiles[id] = {
                    tileX: x,
                    tileY: y,
                    hasTree: x == 2 && y == 2 ? 2 : 0
                };
            }
        }
    }
}
const LEFT_SIDE = 0;
const TOP_SIDE = 1;
const RIGHT_SIDE = 2;
const BOTTOM_SIDE = 3;
export function getTileBounds(entries) {
    const bounds = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
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
    for (const item of entries){
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
export function generateChunk(chunks) {
    const randomAxis = getRandomAxis();
    const randomDirection = getRandomDirection(invertAxis(randomAxis));
    let axisItems = [];
    if (randomAxis === Axis.XAxis) {
        axisItems = chunks.filter((chunk)=>chunk.y == 0);
    } else {
        axisItems = chunks.filter((chunk)=>chunk.x == 0);
    }
    //We now have a random tile to start search outwards from for a free point
    let searchPoint = randomEntry(axisItems);
    let foundPoint = null;
    let searches = 0;
    while(searches < 32){
        const nextPoint = adjacentPoint(searchPoint, randomDirection);
        if (chunks.some((chunk)=>pointEquals(nextPoint, chunk))) {
            searchPoint = nextPoint;
        } else {
            foundPoint = nextPoint;
            break;
        }
        searches += 1;
    }
    return foundPoint;
}
export function generateGround(tiles) {
    const edgeTile = getRandomBoundsPosition(tiles, 1);
    const searchDirection = invertDirection(edgeTile.direction);
    let tilePoint = {
        x: 0,
        y: 0
    };
    let lastSearchPoint = {
        x: edgeTile.x,
        y: edgeTile.y
    };
    //console.log("range distance", rangeDistance(axisRange));
    //const searchStart = performance.now();
    for(let i = 0; i < rangeDistance(edgeTile.axisRange); i++){
        const adjacent = adjacentPoint(lastSearchPoint, searchDirection);
        const tileId = getTileId(adjacent.x, adjacent.y);
        if (!!tiles[tileId]) {
            tilePoint = lastSearchPoint;
            break;
        } else {
            lastSearchPoint = adjacent;
        }
    }
    //const searchEnd = performance.now();
    //console.log("⏱search tile time: ", searchEnd - searchStart);
    return tilePoint;
}
export function getRandomBoundsPosition(tiles, edgeOffset) {
    const entries = Object.entries(tiles);
    const bounds = getTileBounds(entries);
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    let direction = Direction.Down;
    const axis = side % 2 == 0 ? Axis.YAxis : Axis.XAxis;
    const axisRange = getBoundsAxis(bounds, axis);
    switch(side){
        case LEFT_SIDE:
            x = bounds.x1 - edgeOffset;
            y = rangeRandom(axisRange);
            direction = Direction.Left;
            break;
        case TOP_SIDE:
            x = rangeRandom(axisRange);
            y = bounds.y1 - edgeOffset;
            direction = Direction.Up;
            break;
        case RIGHT_SIDE:
            x = bounds.x2 + edgeOffset;
            y = rangeRandom(axisRange);
            direction = Direction.Right;
            break;
        case BOTTOM_SIDE:
            x = rangeRandom(axisRange);
            y = bounds.y2 + edgeOffset;
            direction = Direction.Down;
            break;
    }
    return {
        x,
        y,
        direction,
        axis,
        axisRange
    };
}
