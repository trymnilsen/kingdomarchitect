import {
    snowFlowerResource,
    stoneResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeBiomePonds } from "./placePonds.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateSnow(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomePonds("snow", chunk, Math.random);
    placeBiomeTrees("snow", chunk, chunkEntity, chunkMap);
    placeResource(random(12), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(12), snowFlowerResource, chunk, chunkEntity, chunkMap);
}
