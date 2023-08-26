import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point } from "../../common/point.js";
import {
    GroundChunk,
    GroundTile,
} from "../../game/component/tile/tilesComponent.js";
import { Entity } from "../../game/entity/entity.js";
import { treePrefab } from "../../game/prefab/treePrefab.js";
import { Tileset, TileSetFactory } from "./tileset.js";

export function createRandomTileSet(chunk: GroundChunk): Tileset {
    const tiles: Point[] = [];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            tiles.push({
                x: chunk.chunkX * 3 + x,
                y: chunk.chunkY * 3 + y,
            });
        }
    }

    const bounds = getBounds(tiles);
    //Add inclusive to bounds
    bounds.y2 += 1;
    bounds.x2 += 1;
    const factory = new RandomTileSetFactory(chunk, tiles);
    return {
        name: "randomTile",
        tiles,
        bounds,
        factory,
    };
}

export class RandomTileSetFactory implements TileSetFactory {
    constructor(private chunk: GroundChunk, private tiles: Point[]) {}
    createTiles(): GroundTile[] {
        return this.tiles.map((point) => {
            return {
                tileX: point.x,
                tileY: point.y,
            };
        });
    }
    createEntities(): Entity[] {
        const entities: Entity[] = [];

        const treeX = Math.floor(Math.random() * 3);
        const treeY = Math.floor(Math.random() * 3);
        const treeEntity = treePrefab(generateId("tree"), 2);
        treeEntity.worldPosition = {
            x: this.chunk.chunkX * 3 + treeX,
            y: this.chunk.chunkY * 3 + treeY,
        };

        entities.push(treeEntity);
        return entities;
    }
}
