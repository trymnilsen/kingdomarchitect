import {
    Point,
    adjacentPoints,
    manhattanDistance,
} from "../../../common/point.js";
import { createFirstTileSet } from "../../../data/tileset/firstTile.js";
import { createFourthTileSet } from "../../../data/tileset/fourthTile.js";
import { createRandomTileSet } from "../../../data/tileset/randomTileSet.js";
import { createSecondTileSet } from "../../../data/tileset/secondTile.js";
import { createThirdTileSet } from "../../../data/tileset/thirdTile.js";
import { Tileset } from "../../../data/tileset/tileset.js";
import { createTownTileset } from "../../../data/tileset/town/townTileset.js";
import { getChunkId, getChunkPosition } from "../../chunk.js";
import { getTileId } from "../../tile/tile.js";
import { StatelessComponent } from "../entityComponent.js";
import { TileMapUpdateEvent } from "./tileMapUpdatedEvent.js";
import { GroundChunk, TilesComponent } from "./tilesComponent.js";
import { UnlockableArea } from "./unlockableArea.js";

export class TileGeneratorComponent extends StatelessComponent {
    unlockArea(area: UnlockableArea) {
        const tileComponent = this.entity.requireComponent(TilesComponent);
        const chunks = getChunks(area.tileset.tiles);

        for (const chunk of chunks) {
            tileComponent.setChunk(chunk);
        }

        const factory = area.tileset.factory;
        const groundTiles = factory.createTiles();
        const entities = factory.createEntities();

        for (const tile of groundTiles) {
            tileComponent.setTile(tile);
        }

        const rootEntity = this.entity.getRootEntity();
        for (const entity of entities) {
            rootEntity.addChild(entity);
        }

        this.publishEvent(new TileMapUpdateEvent(tileComponent));
    }

    getUnlockableArea(): UnlockableArea[] {
        //Loop over all chunks
        //Check for chunks that has an edge/adjacent chunk not in the chunkMap
        //Add chunks not in chunkmap to the array of unlockable areas
        //Should unlockable chunks be cached?
        const tileComponent = this.entity.requireComponent(TilesComponent);
        const unlockableChunks = new Map<string, GroundChunk>();
        for (const key in tileComponent.chunkMap) {
            if (
                !Object.prototype.hasOwnProperty.call(
                    tileComponent.chunkMap,
                    key,
                )
            ) {
                continue;
            }

            const chunk = tileComponent.chunkMap[key];
            const adjacentChunks = adjacentPoints(
                { x: chunk.chunkX, y: chunk.chunkY },
                false,
            );

            for (const adjacent of adjacentChunks) {
                const adjacentChunkId = getTileId(adjacent.x, adjacent.y);
                const adjacentChunk = tileComponent.chunkMap[adjacentChunkId];
                //Check if this chunk has already been added
                if (!adjacentChunk && !unlockableChunks.has(adjacentChunkId)) {
                    unlockableChunks.set(adjacentChunkId, {
                        chunkX: adjacent.x,
                        chunkY: adjacent.y,
                    });
                }
            }
        }

        const returnedAreas: UnlockableArea[] = [];
        while (unlockableChunks.size > 0) {
            const nextChunkId = unlockableChunks.keys().next().value;
            const unlockableChunk = unlockableChunks.get(nextChunkId)!;
            //The distance from the center of the map to the chunk is used
            //as the factor to calculate the cost
            const distance = manhattanDistance(
                { x: 0, y: 0 },
                {
                    x: unlockableChunk.chunkX,
                    y: unlockableChunk.chunkY,
                },
            );
            const cost = Math.min(64, Math.pow(2, distance + 1));

            const tileset = this.getTileSet(
                tileComponent,
                unlockableChunk,
                returnedAreas,
            );

            //Find all chunks thats contains the tiles returned and remove them
            if (tileset.tiles.length == 0) {
                console.warn(
                    "Tileset returned zero tiles, this might be a bug",
                );
                unlockableChunks.delete(nextChunkId);
                continue;
            }

            returnedAreas.push({
                tileset,
                cost,
            });

            for (const tilePosition of tileset.tiles) {
                const chunkPosition = getChunkPosition(tilePosition);
                const chunkId = getChunkId(chunkPosition);
                if (unlockableChunks.has(chunkId)) {
                    unlockableChunks.delete(chunkId);
                }
            }
        }

        return returnedAreas;
    }

    private getTileSet(
        tileComponent: TilesComponent,
        chunk: GroundChunk,
        claimedAreas: ReadonlyArray<UnlockableArea>,
    ): Tileset {
        const chunks = Object.keys(tileComponent.chunkMap);
        switch (chunks.length) {
            case 1:
                return createFirstTileSet(chunk);
            case 2:
                return createSecondTileSet(chunk);
            case 3:
                return createThirdTileSet(chunk);
            case 4:
                return createFourthTileSet(chunk);
            case 5:
                const town = createTownTileset(
                    chunk,
                    tileComponent,
                    claimedAreas,
                );
                if (!!town) {
                    return town;
                } else {
                    return createRandomTileSet(chunk);
                }
            default:
                return createRandomTileSet(chunk);
        }
    }
}

function getChunks(tiles: Point[]): GroundChunk[] {
    const chunks: Record<string, GroundChunk> = {};
    for (const tile of tiles) {
        const chunkPosition = getChunkPosition(tile);
        const chunkId = getTileId(chunkPosition.x, chunkPosition.y);
        if (!chunks[chunkId]) {
            chunks[chunkId] = {
                chunkX: chunkPosition.x,
                chunkY: chunkPosition.y,
            };
        }
    }

    return Object.values(chunks);
}
