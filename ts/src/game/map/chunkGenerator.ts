import {
    mapNotNullDistinct,
    randomEntry,
    weightedRandomEntry,
} from "../../common/array.js";
import { randomColor } from "../../common/color.js";
import { generateId } from "../../common/idGenerator.js";
import { adjacentPoints, Point } from "../../common/point.js";
import { TileChunk, TilesComponent } from "../component/tile/tilesComponent.js";
import { Volume } from "../component/tile/volume.js";
import { Entity } from "../entity/entity.js";

export function generateChunk(rootEntity: Entity, chunkPoint: Point) {
    const tileComponent = rootEntity.requireComponent(TilesComponent);
    // Find available volumes with available space
    const adjacentVolumes = mapNotNullDistinct(
        adjacentPoints(chunkPoint),
        (item) => tileComponent.getChunk(item)?.volume,
    ).filter((volume) => volume.size < volume.maxSize);
    const createNewVolume = Math.random() > 0.8;
    if (createNewVolume || adjacentVolumes.length == 0) {
        const maxSize = weightedRandomEntry(
            [1, 2, 4, 8, 12, 16],
            [1, 2, 10, 10, 2, 2],
        );
        const volumeType = randomEntry([
            "desert",
            "forrest",
            "swamp",
            "snow",
            "plains",
        ] as const);
        const volume: Volume = {
            maxSize: maxSize,
            size: 1,
            type: volumeType,
            id: generateId("volume"),
            chunks: [{ x: chunkPoint.x, y: chunkPoint.y }],
            debugColor: randomColor(),
        };
        tileComponent.setChunk({
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: volume,
            discovered: new Set<string>(),
        });
    } else {
        const chosenVolume = randomEntry(adjacentVolumes);
        chosenVolume.size += 1;
        chosenVolume.chunks.push({ x: chunkPoint.x, y: chunkPoint.y });
        tileComponent.setChunk({
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: chosenVolume,
            discovered: new Set<string>(),
        });
    }
}
