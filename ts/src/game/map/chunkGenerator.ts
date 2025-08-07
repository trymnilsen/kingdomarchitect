import {
    mapNotNullDistinct,
    randomEntry,
    weightedRandomEntry,
} from "../../common/array.js";
import { randomColor } from "../../common/color.js";
import { generateId } from "../../common/idGenerator.js";
import { adjacentPoints, Point } from "../../common/point.js";
import { getChunk, TileComponentId } from "../component/tileComponent.js";
import { Entity } from "../entity/entity.js";
import { generateDesert } from "./biome/desert.js";
import { generateForrest } from "./biome/forrest.js";
import { generateMountains } from "./biome/mountains.js";
import { generatePlains } from "./biome/plains.js";
import { generateSnow } from "./biome/snow.js";
import { generateSwamp } from "./biome/swamp.js";
import { generateTaint } from "./biome/taint.js";
import { ChunkSize, type TileChunk } from "./chunk.js";
import type { Volume } from "./volume.js";

/*
//TODO: should return a structure describing the unlock for the action
export function generateChunk(rootEntity: Entity, chunkPoint: Point) {
    const tiles = rootEntity.requireEcsComponent(TileComponentId);
    // Find available volumes with available space
    const adjacentVolumes = mapNotNullDistinct(
        adjacentPoints(chunkPoint),
        (item) => getChunk(tiles, item)?.volume,
    ).filter((volume) => volume.size < volume.maxSize);
    const createNewVolume = Math.random() > 0.8;

    let chunk: Required<TileChunk> | undefined = undefined;
    if (
        tiles.chunks.size > 1 &&
        (createNewVolume || adjacentVolumes.length == 0)
    ) {
        const maxSize = weightedRandomEntry(
            [1, 2, 4, 8, 12, 16, 24, 32],
            [1, 5, 20, 10, 5, 4, 2, 1],
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
        chunk = {
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: volume,
        };
    } else {
        //Weight the items based on maxSize, making it most likely to pick
        //and expand the largest
        const chosenVolume = weightedRandomEntry(
            adjacentVolumes,
            adjacentVolumes.map(
                (volume) =>
                    volume.maxSize +
                    Math.floor(
                        ((volume.maxSize - volume.size) / volume.maxSize) * 32,
                    ),
            ),
        );
        chosenVolume.size += 1;
        chosenVolume.chunks.push({ x: chunkPoint.x, y: chunkPoint.y });
        chunk = {
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: chosenVolume,
        };
    }

    //rootEntity.dispatchAction(makeSetTilesAction(chunk));
    generateChunkEntities(chunk, rootEntity);
}

function generateChunkEntities(chunk: Required<TileChunk>, rootEntity: Entity) {
    const chunkEntity = new Entity(generateId("chunk"));
    chunkEntity.worldPosition = {
        x: chunk.chunkX * ChunkSize,
        y: chunk.chunkY * ChunkSize,
    };
    rootEntity.addChild(chunkEntity);
    switch (chunk.volume.type) {
        case "forrest":
            generateForrest(chunk, chunkEntity);
            break;
        case "desert":
            generateDesert(chunk, chunkEntity);
            break;
        case "mountains":
            generateMountains(chunk, chunkEntity);
            break;
        case "plains":
            generatePlains(chunk, chunkEntity);
            break;
        case "snow":
            generateSnow(chunk, chunkEntity);
            break;
        case "swamp":
            generateSwamp(chunk, chunkEntity);
            break;
        case "taint":
            generateTaint(chunk, chunkEntity);
            break;
    }
}
*/
