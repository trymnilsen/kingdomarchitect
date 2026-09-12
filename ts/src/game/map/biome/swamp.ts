import {
    moonpetalResource,
    mushroomResource,
    swampFlowerResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateSwamp(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomeTrees("swamp", chunk, chunkEntity, chunkMap);
    placeResource(random(8), swampFlowerResource, chunk, chunkEntity, chunkMap);
    placeResource(random(4), mushroomResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), moonpetalResource, chunk, chunkEntity, chunkMap);
}
