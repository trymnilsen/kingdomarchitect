import {
    flowerResource,
    grassResource,
    stoneResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeResource, fixed, random } from "./placeResource.js";

export function generatePlains(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap =
        chunkEntity.requireAncestorEcsComponent(ChunkMapComponentId);

    placeResource(fixed(16), grassResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), flowerResource, chunk, chunkEntity, chunkMap);
}
