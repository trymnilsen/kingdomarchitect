import {
    flowerResource,
    grassResource,
    stoneResource,
} from "../../../data/inventory/items/naturalResource.ts";
import {
    ChunkMapRegistryComponentId,
    getChunkMap,
} from "../../component/chunkMapRegistryComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { overWorldId } from "../scenes.ts";
import { fixed, placeResource, random } from "./placeResource.ts";

export function generatePlains(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = getChunkMap(
        chunkEntity
            .getRootEntity()
            .requireEcsComponent(ChunkMapRegistryComponentId),
        overWorldId,
    );

    if (!chunkMap) {
        throw new Error("No chunk map found");
    }

    placeResource(fixed(16), grassResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), flowerResource, chunk, chunkEntity, chunkMap);
}
