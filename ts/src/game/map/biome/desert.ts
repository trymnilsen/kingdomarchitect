import { cactusFlowerResource } from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeBiomePonds } from "./placePonds.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateDesert(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomePonds("desert", chunk, Math.random);
    placeBiomeTrees("desert", chunk, chunkEntity, chunkMap);
    placeResource(
        random(20),
        cactusFlowerResource,
        chunk,
        chunkEntity,
        chunkMap,
    );
}
