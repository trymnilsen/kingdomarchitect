import {
    swampFlowerResource,
    swampTree2Resource,
    swampTreeResource,
} from "../../../data/inventory/items/naturalResource.js";
import {
    ChunkMapRegistryComponentId,
    getChunkMap,
} from "../../component/chunkMapRegistryComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { overWorldId } from "../scenes.js";
import { fixed, placeResource, random } from "./placeResource.js";

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
