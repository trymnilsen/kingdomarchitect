import type { Bounds } from "../../../common/bounds.ts";
import { type Point, encodePosition } from "../../../common/point.ts";
import {
    type ChunkMap,
    getEntitiesInChunkMapWithin,
} from "../../component/chunkMapComponent.ts";
import { getTerrainAtWorldPosition, type TileChunk } from "../chunk.ts";
import { isBuildableTerrain } from "../terrain.ts";

/**
 * Generates random spawn points within a chunk, avoiding existing entities
 */
export function generateSpawnPoints(
    amount: number,
    chunk: TileChunk,
    area: Bounds,
    chunkMap: ChunkMap,
): Point[] {
    if (amount === 0) {
        return [];
    }

    const spawnPoints: Point[] = [];
    const items = getEntitiesInChunkMapWithin(chunkMap, area);
    const skipPoints = new Set<number>();

    // Mark existing entity positions as occupied
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const encodedPosition = encodePosition(
            item.worldPosition.x,
            item.worldPosition.y,
        );
        skipPoints.add(encodedPosition);
    }

    const width = area.x2 - area.x1 + 1;
    const height = area.y2 - area.y1 + 1;
    const totalCells = width * height;
    for (let j = 0; j < amount; j++) {
        const start = Math.floor(Math.random() * totalCells);

        for (let i = 0; i < totalCells; i++) {
            const index = (start + i) % totalCells;
            const worldPosition: Point = {
                x: area.x1 + (index % width),
                y: area.y1 + Math.floor(index / width),
            };
            const encodedPoint = encodePosition(
                worldPosition.x,
                worldPosition.y,
            );
            if (
                skipPoints.has(encodedPoint) ||
                !isBuildableTerrain(
                    getTerrainAtWorldPosition(
                        chunk,
                        worldPosition.x,
                        worldPosition.y,
                    ),
                )
            ) {
                continue;
            }

            spawnPoints.push(worldPosition);
            skipPoints.add(encodedPoint);
            break;
        }
    }

    return spawnPoints;
}
