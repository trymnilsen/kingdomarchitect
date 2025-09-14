import {
    stoneResource,
    treeResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import { resourcePrefab } from "../../prefab/resourcePrefab.js";
import type { TileChunk } from "../chunk.js";
import { placeRocks } from "../item/rocks.js";
import { generateSpawnPoints } from "../item/vegetation.js";

export function generateForrest(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const trees = generateSpawnPoints(
        16,
        { x: chunk.chunkX, y: chunk.chunkY },
        chunkMap,
    );

    for (const treePosition of trees) {
        const treeEntity = resourcePrefab(treeResource);
        treeEntity.worldPosition = treePosition;
        chunkEntity.addChild(treeEntity);
    }

    const numberOfStones = Math.round(Math.random() * 3);
    const stonePositions = generateSpawnPoints(
        numberOfStones,
        { x: chunk.chunkX, y: chunk.chunkY },
        chunkMap,
    );

    for (const stone of stonePositions) {
        const stoneEntity = resourcePrefab(stoneResource);
        stoneEntity.worldPosition = stone;
        chunkEntity.addChild(stoneEntity);
    }

    placeRocks(chunk, chunkEntity);
}
