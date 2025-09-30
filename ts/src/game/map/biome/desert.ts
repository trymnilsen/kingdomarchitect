import {
    cactusFlowerResource,
    cactusResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { fixed, placeResource, random } from "./placeResource.js";

export function generateDesert(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);

    placeResource(fixed(16), cactusResource, chunk, chunkEntity, chunkMap);
    placeResource(
        random(5),
        cactusFlowerResource,
        chunk,
        chunkEntity,
        chunkMap,
    );
}
