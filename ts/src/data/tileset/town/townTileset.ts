import { getBounds } from "../../../common/bounds.js";
import { Point, addPoint, pointEquals } from "../../../common/point.js";
import {
    ChunkSize,
    getChunkId,
    getChunkPosition,
} from "../../../game/chunk.js";
import {
    GroundChunk,
    GroundTile,
    TilesComponent,
} from "../../../game/component/tile/tilesComponent.js";
import { UnlockableArea } from "../../../game/component/tile/unlockableArea.js";
import { Entity } from "../../../game/entity/entity.js";
import { TileSetFactory, Tileset } from "../tileset.js";

export function createTownTileset(
    chunk: GroundChunk,
    tileComponent: TilesComponent,
    claimedAreas: ReadonlyArray<UnlockableArea>,
): Tileset | null {
    //Check if there is space above the chunk
    //TODO: adapt this based on chunk position
    const townSize = townSizeInTiles();
    if (availableSpace(townSize, chunk, tileComponent, claimedAreas)) {
        return generateTileset(chunk, townSize);
    } else {
        return null;
    }
}

function availableSpace(
    size: number,
    chunk: GroundChunk,
    tileComponent: TilesComponent,
    claimedAreas: ReadonlyArray<UnlockableArea>,
): boolean {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const point = addPoint(
                { x: chunk.chunkX * ChunkSize, y: chunk.chunkY * ChunkSize },
                { x, y },
            );

            const hasPointInClaimedArea = claimedAreas.some((entry) => {
                return entry.tileset.tiles.some((tilePoint) => {
                    return pointEquals(tilePoint, point);
                });
            });

            if (hasPointInClaimedArea) {
                return false;
            }

            const tileAtPos = tileComponent.getTile(point);
            if (!!tileAtPos) {
                return false;
            }
        }
    }
    return true;
}

function generateTileset(chunk: GroundChunk, townSize: number): Tileset {
    const tiles: Point[] = [];
    for (let x = 0; x < townSize; x++) {
        for (let y = 0; y < townSize; y++) {
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

    return {
        bounds: bounds,
        tiles: tiles,
        factory: new TownFactory(),
        name: "town",
    };
}

function townSizeInTiles(): number {
    //Five city block, each block is 9 tiles
    return 9;
}

export class TownFactory implements TileSetFactory {
    createTiles(): GroundTile[] {
        throw new Error("Method not implemented.");
    }
    createEntities(): Entity[] {
        throw new Error("Method not implemented.");
    }
}
