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
import { sprites2 } from "../../../../asset/sprite.js";
import { adjacentPoints, manhattanDistance } from "../../../../common/point.js";
import { createFirstTileSet } from "../../../../data/tileset/firstTile.js";
import { createRandomTileSet } from "../../../../data/tileset/randomTileSet.js";
import { ChunkSize, getChunkPosition } from "../../chunk.js";
import { getTileId, TileSize } from "../../tile/tile.js";
import { EntityComponent } from "../entityComponent.js";
import { TileMapUpdateEvent } from "./tileMapUpdatedEvent.js";
export class TilesComponent extends EntityComponent {
    getBounds() {
        //Loop over chunk map and get min and max
        //multiply this to get tile bounds
        const chunks = Object.values(this.chunkMap);
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const chunk of chunks){
            if (chunk.chunkX > maxX) {
                maxX = chunk.chunkX;
            }
            if (chunk.chunkX < minX) {
                minX = chunk.chunkX;
            }
            if (chunk.chunkY > maxY) {
                maxY = chunk.chunkY;
            }
            if (chunk.chunkY < minY) {
                minY = chunk.chunkY;
            }
        }
        return {
            x1: minX * ChunkSize,
            y1: minY * ChunkSize,
            x2: maxX * ChunkSize + ChunkSize - 1,
            y2: maxY * ChunkSize + ChunkSize - 1
        };
    }
    getTile(tilePosition) {
        return this.tileMap[getTileId(tilePosition.x, tilePosition.y)] || null;
    }
    getTiles(predicate) {
        return Object.values(this.tileMap).filter(predicate);
    }
    setTile(tile) {
        this.tileMap[getTileId(tile.tileX, tile.tileY)] = tile;
    }
    unlockArea(area) {
        const chunks = getChunks(area.tileset.tiles);
        for (const chunk of chunks){
            this.chunkMap[getTileId(chunk.chunkX, chunk.chunkY)] = chunk;
        }
        const factory = area.tileset.factory;
        const groundTiles = factory.createTiles();
        const entities = factory.createEntities();
        for (const tile of groundTiles){
            this.setTile(tile);
        }
        const rootEntity = this.entity.getRootEntity();
        for (const entity of entities){
            rootEntity.addChild(entity);
        }
        this.publishEvent(new TileMapUpdateEvent(this));
    }
    getUnlockableArea() {
        //Loop over all chunks
        //Check for chunks that has an edge/adjacent chunk not in the chunkMap
        //Add chunks not in chunkmap to the array of unlockable areas
        //Should unlockable chunks be cached?
        const unlockableChunks = {};
        for(const key in this.chunkMap){
            if (!Object.prototype.hasOwnProperty.call(this.chunkMap, key)) {
                continue;
            }
            const chunk = this.chunkMap[key];
            const adjacentChunks = adjacentPoints({
                x: chunk.chunkX,
                y: chunk.chunkY
            }, false);
            for (const adjacent of adjacentChunks){
                const chunkId = getTileId(adjacent.x, adjacent.y);
                if (!this.chunkMap[chunkId] && !unlockableChunks[chunkId]) {
                    unlockableChunks[chunkId] = {
                        chunkX: adjacent.x,
                        chunkY: adjacent.y
                    };
                }
            }
        }
        return Object.values(unlockableChunks).map((unlockableChunk)=>{
            //The distance from the center of the map to the chunk is used
            //as the factor to calculate the cost
            const distance = manhattanDistance({
                x: 0,
                y: 0
            }, {
                x: unlockableChunk.chunkX,
                y: unlockableChunk.chunkY
            });
            const cost = Math.min(999, Math.pow(2, distance + 1));
            const tileset = this.getTileSet(unlockableChunk);
            return {
                tileset,
                cost
            };
        });
    }
    onDraw(context, screenPosition) {
        for(const tileId in this.tileMap){
            const tile = this.tileMap[tileId];
            context.drawRectangle({
                x: tile.tileX * TileSize,
                y: tile.tileY * TileSize,
                width: TileSize - 2,
                height: TileSize - 2,
                fill: "green"
            });
            if (tile.hasTree && tile.hasTree > 0) {
                let sprite = sprites2.tree_1;
                if (tile.hasTree >= 2.0) {
                    sprite = sprites2.tree_2;
                }
                if (tile.hasTree >= 3.0) {
                    sprite = sprites2.tree_3;
                }
                context.drawSprite({
                    sprite: sprite,
                    x: tile.tileX * TileSize + 4,
                    y: tile.tileY * TileSize
                });
            }
        }
    }
    getTileSet(chunk) {
        const chunks = Object.keys(this.chunkMap);
        if (chunks.length == 1) {
            return createFirstTileSet(chunk);
        } else {
            return createRandomTileSet(chunk);
        }
    }
    constructor(){
        super();
        _define_property(this, "tileMap", {});
        _define_property(this, "chunkMap", {});
        for(let x = 0; x < ChunkSize; x++){
            for(let y = 0; y < ChunkSize; y++){
                const id = getTileId(x, y);
                this.tileMap[id] = {
                    tileX: x,
                    tileY: y,
                    hasTree: x == 2 && y == 2 ? 2 : 0
                };
            }
        }
        this.chunkMap[getTileId(0, 0)] = {
            chunkX: 0,
            chunkY: 0
        };
    }
}
function getChunks(tiles) {
    const chunks = {};
    for (const tile of tiles){
        const chunkPosition = getChunkPosition(tile);
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        if (!chunks[chunkId]) {
            chunks[chunkId] = {
                chunkX: chunkPosition.x,
                chunkY: chunkPosition.y
            };
        }
    }
    return Object.values(chunks);
}
