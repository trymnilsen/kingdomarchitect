import { cactusFlowerResource } from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateDesert(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomeTrees("desert", chunk, chunkEntity, chunkMap);
    placeResource(
        random(5),
        cactusFlowerResource,
        chunk,
        chunkEntity,
        chunkMap,
    );
}
