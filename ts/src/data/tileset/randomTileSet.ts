import { getBounds } from "../../common/bounds";
import { Point } from "../../common/point";
import {
    GroundChunk,
    GroundTile,
} from "../../game/world/component/tile/tilesComponent";
import { Entity } from "../../game/world/entity/entity";
import { Tileset, TileSetFactory } from "./tileset";

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
            const plantTree = Math.random() > 0.7;
            return {
                tileX: point.x,
                tileY: point.y,
                hasTree: plantTree ? Math.floor(Math.random() * 4) : 0,
            };
        });
    }
    createEntities(): Entity[] {
        return [];
    }
}
