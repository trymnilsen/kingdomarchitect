import type { TileChunk } from "../chunk.ts";
import type { Entity } from "../../entity/entity.ts";
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.ts";
import { resourcePrefab } from "../../prefab/resourcePrefab.ts";
import { generateSpawnPoints } from "../item/vegetation.ts";
import type { ChunkMap } from "../../component/chunkMapComponent.ts";

export type CountFn = (max?: number) => number;

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
    const count = countFn();
    const positions = generateSpawnPoints(
        count,
        { x: chunk.chunkX, y: chunk.chunkY },
        chunkMap,
    );
    for (const pos of positions) {
        const entity = resourcePrefab(resource);
        entity.worldPosition = pos;
        chunkEntity.addChild(entity);
    }
}
