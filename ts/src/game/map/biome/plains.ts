import {
    flowerResource,
    grassResource,
    stoneResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { fixed, placeResource, random } from "./placeResource.ts";

export function generatePlains(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeResource(fixed(64), grassResource, chunk, chunkEntity, chunkMap);
    placeResource(random(12), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(12), flowerResource, chunk, chunkEntity, chunkMap);
}
