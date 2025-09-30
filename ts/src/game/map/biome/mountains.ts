import {
    mushroomResource,
    pineResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeResource, fixed, random } from "./placeResource.js";

export function generateMountains(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);

    placeResource(fixed(16), pineResource, chunk, chunkEntity, chunkMap);
    placeResource(random(8), mushroomResource, chunk, chunkEntity, chunkMap);
}
