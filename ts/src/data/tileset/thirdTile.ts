import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point } from "../../common/point.js";
import {
    GroundChunk,
    GroundTile,
} from "../../game/component/tile/tilesComponent.js";
import { Entity } from "../../game/world/entity/entity.js";
import { mobPrefab } from "../../game/world/prefab/mobPrefab.js";
import { TileSetFactory, Tileset } from "./tileset.js";

export function createThirdTileSet(chunk: GroundChunk): Tileset {
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
    const factory = new ThirdTileFactory(chunk, tiles);
    return {
        name: "thirdTile",
        tiles,
        bounds,
        factory,
    };
}

export class ThirdTileFactory implements TileSetFactory {
    constructor(private chunk: GroundChunk, private tiles: Point[]) {}

    createTiles(): GroundTile[] {
        return this.tiles.map((point) => {
            return {
                tileX: point.x,
                tileY: point.y,
                hasTree: 0,
            };
        });
    }

    createEntities(): Entity[] {
        const entities: Entity[] = [];

        const stoneEntity = mobPrefab(generateId("mob"));
        stoneEntity.worldPosition = {
            x: this.chunk.chunkX * 3 + 1,
            y: this.chunk.chunkY * 3 + 1,
        };

        entities.push(stoneEntity);
        return entities;
    }
}
