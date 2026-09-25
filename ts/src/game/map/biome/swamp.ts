import {
    moonpetalResource,
    mushroomResource,
    swampFlowerResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeBiomePonds } from "./placePonds.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateSwamp(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomePonds("swamp", chunk, Math.random);
    placeBiomeTrees("swamp", chunk, chunkEntity, chunkMap);
    placeResource(
        random(32),
        swampFlowerResource,
        chunk,
        chunkEntity,
        chunkMap,
    );
    placeResource(random(16), mushroomResource, chunk, chunkEntity, chunkMap);
    placeResource(random(12), moonpetalResource, chunk, chunkEntity, chunkMap);
}
