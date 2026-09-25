import { mushroomResource } from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeBiomePonds } from "./placePonds.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateMountains(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomePonds("mountains", chunk, Math.random);
    placeBiomeTrees("mountains", chunk, chunkEntity, chunkMap);
    placeResource(random(32), mushroomResource, chunk, chunkEntity, chunkMap);
}
