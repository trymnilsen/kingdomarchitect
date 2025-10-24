import {
    berryBushResource,
    stoneResource,
    treeResource,
} from "../../../data/inventory/items/naturalResource.js";
import {
    getChunkMap,
    ChunkMapRegistryComponentId,
} from "../../component/chunkMapRegistryComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeRocks } from "../item/rocks.js";
import { overWorldId } from "../scenes.js";
import { fixed, placeResource, random } from "./placeResource.js";

export function generateForrest(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = getChunkMap(
        chunkEntity
            .getRootEntity()
            .requireEcsComponent(ChunkMapRegistryComponentId),
        overWorldId,
    );

    if (!chunkMap) {
        throw new Error("No chunk map found");
    }

    placeResource(fixed(16), treeResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), berryBushResource, chunk, chunkEntity, chunkMap);

    placeRocks(chunk, chunkEntity);
}
