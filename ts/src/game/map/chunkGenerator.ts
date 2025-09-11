import {
    mapNotNullDistinct,
    randomEntry,
    weightedRandomEntry,
} from "../../common/array.js";
import { randomColor } from "../../common/color.js";
import { generateId } from "../../common/idGenerator.js";
import { adjacentPoints, Point } from "../../common/point.js";
import { KingdomComponentId } from "../component/kingdomComponent.js";
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
import { placeSettlement } from "./item/settlement.js";
import { queryEntitiesWithinVolume } from "./query/queryEntity.js";
import type { Volume } from "./volume.js";

//TODO: should return a structure describing the unlock for the action
export function generateChunk(
    rootEntity: Entity,
    chunkPoint: Point,
): Required<TileChunk> {
    const tiles = rootEntity.requireEcsComponent(TileComponentId);
    // Find available volumes with available space
    const adjacentVolumes = mapNotNullDistinct(
        adjacentPoints(chunkPoint),
        (item) => getChunk(tiles, item)?.volume,
    ).filter((volume) => volume.chunks.length < volume.maxSize);
    const createNewVolume = Math.random() > 0.8;

    let chunk: Required<TileChunk> | undefined = undefined;
    // Check for adjacent start biome with available space
    // we always expand the starting volume fully
    const startBiome = adjacentVolumes.find(
        (volume) => (volume as any).isStartBiome === true,
    );
    if (startBiome) {
        startBiome.chunks.push({ x: chunkPoint.x, y: chunkPoint.y });
        chunk = {
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: startBiome,
        };
    } else if (
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
        const newVolume: Volume = {
            maxSize: maxSize,
            type: volumeType,
            id: generateId("volume"),
            chunks: [{ x: chunkPoint.x, y: chunkPoint.y }],
            debugColor: randomColor(),
        };

        chunk = {
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: newVolume,
        };
        console.log("Volume generated", newVolume);
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
        chunk = {
            chunkX: chunkPoint.x,
            chunkY: chunkPoint.y,
            volume: chosenVolume,
        };
    }

    generateChunkEntities(chunk, rootEntity);
    return chunk;
}

function generateChunkEntities(chunk: Required<TileChunk>, rootEntity: Entity) {
    const chunkEntity = new Entity(generateId("chunk"));
    chunkEntity.worldPosition = {
        x: chunk.chunkX * ChunkSize,
        y: chunk.chunkY * ChunkSize,
    };
    //TODO: Check for existing settlement
    //TODO: query for settlement component and checking if within chunk might be more efficient
    const settlements = queryEntitiesWithinVolume(
        rootEntity,
        chunk.volume,
        (entity) => entity.hasComponent(KingdomComponentId),
    );
    rootEntity.addChild(chunkEntity);
    
    if (settlements.length === 0 && !chunk.volume.isStartBiome) {
        placeSettlement(chunk, chunkEntity);
    }

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
