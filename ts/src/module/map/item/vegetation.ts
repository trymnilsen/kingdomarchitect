import { encodePosition, Point } from "../../../common/point.js";
import { treeResource } from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponent } from "../../../game/component/chunkMapComponent.js";
import { Entity } from "../../../game/entity/entity.js";
import { resourcePrefab } from "../../../game/prefab/resourcePrefab.js";
import { ChunkSize, getChunkBounds } from "../chunk.js";

export function spawnTree(
    amount: number,
    chunk: Point,
    chunkMap: ChunkMapComponent,
): Entity[] {
    if (!chunkMap) {
        throw new Error("No chunk map component found");
    }
    const entities: Entity[] = [];
    const chunkBounds = getChunkBounds(chunk);
    const items = chunkMap.getEntitiesWithin(chunkBounds);
    const skipPoints = new Set<number>();
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

            const tree = resourcePrefab(treeResource);
            tree.worldPosition = {
                x: chunkBounds.x1 + x,
                y: chunkBounds.y1 + y,
            };

            entities.push(tree);
            skipPoints.add(encodedPoint);
            break;
        }
    }

    return entities;
}
