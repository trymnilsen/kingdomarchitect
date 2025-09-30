import type { TileChunk } from "../chunk.js";
import type { Entity } from "../../entity/entity.js";
import type { ChunkMapComponent } from "../../component/chunkMapComponent.js";
import type { NaturalResource } from "../../../data/inventory/items/naturalResource.js";
import { resourcePrefab } from "../../prefab/resourcePrefab.js";
import { generateSpawnPoints } from "../item/vegetation.js";

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
    chunkMap: ChunkMapComponent,
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
