import {
    berryBushResource,
    stoneResource,
    treeResource,
} from "../../../data/inventory/items/naturalResource.ts";
import {
    getChunkMap,
    ChunkMapRegistryComponentId,
} from "../../component/chunkMapRegistryComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeRocks } from "../item/rocks.ts";
import { overWorldId } from "../scenes.ts";
import { fixed, placeResource, random } from "./placeResource.ts";

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
