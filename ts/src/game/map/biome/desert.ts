import {
    cactusFlowerResource,
    cactusResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { fixed, placeResource, random } from "./placeResource.ts";

export function generateDesert(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeResource(fixed(16), cactusResource, chunk, chunkEntity, chunkMap);
    placeResource(
        random(5),
        cactusFlowerResource,
        chunk,
        chunkEntity,
        chunkMap,
    );
}
