import {
    berryBushResource,
    stoneResource,
    treeResource,
} from "../../../data/inventory/items/naturalResource.js";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.js";
import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeRocks } from "../item/rocks.js";
import { fixed, placeResource, random } from "./placeResource.js";

export function generateForrest(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMap = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);

    placeResource(fixed(16), treeResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), berryBushResource, chunk, chunkEntity, chunkMap);

    placeRocks(chunk, chunkEntity);
}
