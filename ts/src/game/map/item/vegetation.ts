import { encodePosition, Point } from "../../../common/point.js";
import { treeResource } from "../../../data/inventory/items/naturalResource.js";
import {
    ChunkMapComponent,
    getEntitiesInChunkMapWithin,
} from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import { resourcePrefab } from "../../prefab/resourcePrefab.js";
import { ChunkSize, getChunkBounds } from "../chunk.js";

/**
 * Generates random spawn points within a chunk, avoiding existing entities
 */
export function generateSpawnPoints(
    amount: number,
    chunk: Point,
    chunkMap: ChunkMapComponent,
): Point[] {
    if (!chunkMap) {
        throw new Error("No chunk map component found");
    }

    const spawnPoints: Point[] = [];
    const chunkBounds = getChunkBounds(chunk);
    const items = getEntitiesInChunkMapWithin(chunkMap, chunkBounds);
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

    const totalCells = ChunkSize * ChunkSize;
    for (let j = 0; j < amount; j++) {
        const start = Math.floor(Math.random() * totalCells);

        for (let i = 0; i < totalCells; i++) {
            const index = (start + i) % totalCells;
            const x = index % ChunkSize;
            const y = Math.floor(index / ChunkSize);
            const encodedPoint = encodePosition(x, y);
            if (skipPoints.has(encodedPoint)) {
                continue;
            }

            const worldPosition: Point = {
                x: chunkBounds.x1 + x,
                y: chunkBounds.y1 + y,
            };

            spawnPoints.push(worldPosition);
            skipPoints.add(encodedPoint);
            break;
        }
    }

    return spawnPoints;
}
