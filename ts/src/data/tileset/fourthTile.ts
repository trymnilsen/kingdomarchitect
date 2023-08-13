import { getBounds } from "../../common/bounds.js";
import { generateId } from "../../common/idGenerator.js";
import { Point } from "../../common/point.js";
import {
    GroundChunk,
    GroundTile,
} from "../../game/component/tile/tilesComponent.js";
import { Entity } from "../../game/world/entity/entity.js";
import { ruinsPrefab } from "../../game/world/prefab/ruinsPrefab.js";
import { TileSetFactory, Tileset } from "./tileset.js";

export function createFourthTileSet(chunk: GroundChunk): Tileset {
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
    const factory = new FourthTileFactory(chunk, tiles);
    return {
        name: "fourthTile",
        tiles,
        bounds,
        factory,
    };
}

export class FourthTileFactory implements TileSetFactory {
    constructor(private chunk: GroundChunk, private tiles: Point[]) {}

    createTiles(): GroundTile[] {
        return this.tiles.map((point) => {
            return {
                tileX: point.x,
                tileY: point.y,
                hasTree: this.hasTree(point),
            };
        });
    }

    createEntities(): Entity[] {
        const entities: Entity[] = [];

        const ruinsEntity = ruinsPrefab(generateId("ruins"));
        ruinsEntity.worldPosition = {
            x: this.chunk.chunkX * 3 + 1,
            y: this.chunk.chunkY * 3 + 1,
        };

        entities.push(ruinsEntity);
        return entities;
    }

    private hasTree(point: Point): number {
        const x = point.x % 3;
        const y = point.y % 3;

        const isFirstPosition = y == 0 && x == 1;
        const isSecondPosition = y == 2 && x == 0;

        if (isFirstPosition || isSecondPosition) {
            return Math.floor(Math.random() * 3) + 1;
        } else {
            return 0;
        }
    }
}
