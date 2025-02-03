import { generateId } from "../../../common/idGenerator.js";
import { encodePosition, Point, pointEquals } from "../../../common/point.js";
import { SpatialChunkMapComponent } from "../../component/world/spatialChunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import { treePrefab } from "../../prefab/treePrefab.js";
import { ChunkSize, getChunkBounds } from "../chunk.js";

export function spawnTree(amount: number, chunk: Point, rootEntity: Entity) {
    const chunkMap = rootEntity.requireComponent(SpatialChunkMapComponent);
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

            const tree = treePrefab(
                generateId("tree"),
                Math.floor(Math.random() * 3),
            );
            tree.worldPosition = {
                x: chunkBounds.x1 + x,
                y: chunkBounds.y1 + y,
            };

            rootEntity.addChild(tree);
            skipPoints.add(encodedPoint);
            break;
        }
    }
}
