import {
    swampFlowerResource,
    swampTree2Resource,
    swampTreeResource,
} from "../../../data/inventory/items/naturalResource.ts";
import {
    ChunkMapRegistryComponentId,
    getChunkMap,
} from "../../component/chunkMapRegistryComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { overWorldId } from "../scenes.ts";
import { fixed, placeResource, random } from "./placeResource.ts";

export function generateSwamp(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = getChunkMap(
        chunkEntity
            .getRootEntity()
            .requireEcsComponent(ChunkMapRegistryComponentId),
        overWorldId,
    );

    if (!chunkMap) {
        throw new Error("No chunk map found");
    }

    placeResource(fixed(8), swampTreeResource, chunk, chunkEntity, chunkMap);
    placeResource(fixed(8), swampTree2Resource, chunk, chunkEntity, chunkMap);
    placeResource(random(8), swampFlowerResource, chunk, chunkEntity, chunkMap);
}
