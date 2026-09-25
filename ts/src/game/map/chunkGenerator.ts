import {
    mapNotNullDistinct,
    randomEntry,
    weightedRandomEntry,
} from "../../common/array.ts";
import { log } from "../../common/logging/logger.ts";
import { randomColor } from "../../common/color/hexColor.ts";
import { generateId } from "../../common/idGenerator.ts";
import { type Point, adjacentPoints } from "../../common/point.ts";
import { getChunk, TileComponentId } from "../component/tileComponent.ts";
import { Entity } from "../entity/entity.ts";
import { generateDesert } from "./biome/desert.ts";
import { generateForrest } from "./biome/forrest.ts";
import { generateMountains } from "./biome/mountains.ts";
import { generatePlains } from "./biome/plains.ts";
import { generateSnow } from "./biome/snow.ts";
import { generateSwamp } from "./biome/swamp.ts";
import { generateTaint } from "./biome/taint.ts";
import {
    type GeneratedTileChunk,
    ChunkSize,
    createLandTerrain,
} from "./chunk.ts";
import type { Volume } from "./volume.ts";

export type GeneratedChunk = {
    chunk: GeneratedTileChunk;
    chunkEntity: Entity;
};

const volumeTileSizes = [256, 512, 768, 1024, 1536, 2048, 3072, 4096];
const volumeTileSizeWeights = [5, 20, 20, 10, 4, 2, 1, 1];

function volumeChunkCount(tiles: number): number {
    return Math.max(1, Math.round(tiles / (ChunkSize * ChunkSize)));
}

//TODO: should return a structure describing the unlock for the action
export function generateChunk(
    rootEntity: Entity,
    chunkPoint: Point,
): GeneratedChunk {
    const tiles = rootEntity.requireEcsComponent(TileComponentId);
    // Find available volumes with available space
    const adjacentVolumes = mapNotNullDistinct(
        adjacentPoints(chunkPoint),
        (item) => getChunk(tiles, item)?.volume,
    ).filter((volume) => volume.chunks.length < volume.maxSize);
    const createNewVolume = Math.random() > 0.8;

    let volume: Volume;
    // Check for adjacent start biome with available space
    // we always expand the starting volume fully
    const startBiome = adjacentVolumes.find(
        (volume) => (volume as any).isStartBiome === true,
    );
    if (startBiome) {
        startBiome.chunks.push({ x: chunkPoint.x, y: chunkPoint.y });
        volume = startBiome;
    } else if (
        tiles.chunks.size > 1 &&
        (createNewVolume || adjacentVolumes.length == 0)
    ) {
        const maxSize = volumeChunkCount(
            weightedRandomEntry(volumeTileSizes, volumeTileSizeWeights),
        );
        const volumeType = randomEntry([
            "desert",
            "forrest",
            "swamp",
            "snow", 
            "plains",
            "mountains",
        ] as const);
        volume = {
            maxSize: maxSize,
            type: volumeType,
            id: generateId("volume"),
            chunks: [{ x: chunkPoint.x, y: chunkPoint.y }],
            debugColor: randomColor(),
        };
        log.info("Volume generated", { volume });
    } else {
        //Weight the items based on maxSize, making it most likely to pick
        //and expand the largest
        const chosenVolume = weightedRandomEntry(
            adjacentVolumes,
            adjacentVolumes.map(
                (volume) =>
                    volume.maxSize +
                    Math.floor(
                        ((volume.maxSize - volume.chunks.length) /
                            volume.maxSize) *
                            32,
                    ),
            ),
        );
        chosenVolume.chunks.push({ x: chunkPoint.x, y: chunkPoint.y });
        volume = chosenVolume;
    }

    const chunk: GeneratedTileChunk = {
        chunkX: chunkPoint.x,
        chunkY: chunkPoint.y,
        volume,
        terrain: createLandTerrain(),
    };
    const chunkEntity = generateChunkEntities(chunk, rootEntity);
    return { chunk, chunkEntity };
}

function generateChunkEntities(
    chunk: GeneratedTileChunk,
    rootEntity: Entity,
): Entity {
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

    return chunkEntity;
}
