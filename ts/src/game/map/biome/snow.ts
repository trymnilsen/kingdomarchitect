import {
    snowFlowerResource,
    snowTreeResource,
    stoneResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { fixed, placeResource, random } from "./placeResource.js";

export function generateSnow(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap =
        chunkEntity.requireAncestorEcsComponent(ChunkMapComponentId);

    placeResource(fixed(16), snowTreeResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), snowFlowerResource, chunk, chunkEntity, chunkMap);
}
