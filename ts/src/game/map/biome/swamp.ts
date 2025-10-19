import {
    swampFlowerResource,
    swampTree2Resource,
    swampTreeResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { fixed, placeResource, random } from "./placeResource.js";

export function generateSwamp(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap =
        chunkEntity.requireAncestorEcsComponent(ChunkMapComponentId);

    placeResource(fixed(8), swampTreeResource, chunk, chunkEntity, chunkMap);
    placeResource(fixed(8), swampTree2Resource, chunk, chunkEntity, chunkMap);
    placeResource(random(8), swampFlowerResource, chunk, chunkEntity, chunkMap);
}
