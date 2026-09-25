import { getChunkBounds, type TileChunk } from "../chunk.ts";
import type { Entity } from "../../entity/entity.ts";
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.ts";
import { resourcePrefab } from "../../prefab/resourcePrefab.ts";
import { generateSpawnPoints } from "../item/vegetation.ts";
import type { ChunkMap } from "../../component/chunkMapComponent.ts";
import { biomes, TREES_PER_CHUNK, type BiomeType } from "../biome.ts";

export type CountFn = () => number;

export function fixed(n: number): CountFn {
    return () => n;
}

export function random(max: number): CountFn {
    return () => Math.round(Math.random() * max);
}

export function placeResource(
    countFn: CountFn,
    resource: NaturalResource,
    chunk: TileChunk,
    chunkEntity: Entity,
    chunkMap: ChunkMap,
) {
    const positions = generateSpawnPoints(
        countFn(),
        chunk,
        getChunkBounds({ x: chunk.chunkX, y: chunk.chunkY }),
        chunkMap,
    );
    for (const pos of positions) {
        const entity = resourcePrefab(resource);
        entity.worldPosition = pos;
        chunkEntity.addChild(entity);
    }
}

export function placeBiomeTrees(
    biome: BiomeType,
    chunk: TileChunk,
    chunkEntity: Entity,
    chunkMap: ChunkMap,
) {
    const trees = biomes[biome].trees;
    if (trees.length === 0) {
        return;
    }
    const perKind = Math.round(TREES_PER_CHUNK / trees.length);
    for (const tree of trees) {
        placeResource(fixed(perKind), tree, chunk, chunkEntity, chunkMap);
    }
}
