import {
    swampFlowerResource,
    swampTree2Resource,
    swampTreeResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { fixed, placeResource, random } from "./placeResource.ts";

export function generateSwamp(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeResource(fixed(8), swampTreeResource, chunk, chunkEntity, chunkMap);
    placeResource(fixed(8), swampTree2Resource, chunk, chunkEntity, chunkMap);
    placeResource(random(8), swampFlowerResource, chunk, chunkEntity, chunkMap);
}
