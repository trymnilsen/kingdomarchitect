import { generateId } from "../../../common/idGenerator.js";
import {
    addPoint,
    decodePosition,
    multiplyPoint,
} from "../../../common/point.js";
import { SparseSet } from "../../../common/structure/sparseSet.js";
import { Entity } from "../../../game/entity/entity.js";
import { encodePosition, Point } from "../../../common/point.js";
import { ChunkSize, getChunkBounds } from "../chunk.js";
import { ChunkMapComponent } from "../../../game/component/chunkMapComponent.js";
import { resourcePrefab } from "../../../game/prefab/resourcePrefab.js";
import { treeResource } from "../../../data/inventory/items/naturalResource.js";

export function spawnTree(amount: number, chunk: Point, entity: Entity) {
    const chunkMap = entity.getRootEntity().getEcsComponent(ChunkMapComponent);
    if (!chunkMap) {
        throw new Error("No chunk map component found");
    }
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

            entity.addChild(tree);
            skipPoints.add(encodedPoint);
            break;
        }
    }
}
