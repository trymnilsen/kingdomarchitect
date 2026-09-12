import {
    berryBushResource,
    moonpetalResource,
    stoneResource,
} from "../../../data/inventory/items/naturalResource.ts";
import { ChunkMapComponentId } from "../../component/chunkMapComponent.ts";
import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeRocks } from "../item/rocks.ts";
import { placeBiomeTrees, placeResource, random } from "./placeResource.ts";

export function generateForrest(chunk: TileChunk, chunkEntity: Entity) {
    const chunkMapComponent = chunkEntity
        .getRootEntity()
        .requireEcsComponent(ChunkMapComponentId);
    const chunkMap = chunkMapComponent.chunkMap;

    placeBiomeTrees("forrest", chunk, chunkEntity, chunkMap);
    placeResource(random(3), stoneResource, chunk, chunkEntity, chunkMap);
    placeResource(random(3), berryBushResource, chunk, chunkEntity, chunkMap);
    placeResource(random(2), moonpetalResource, chunk, chunkEntity, chunkMap);

    placeRocks(chunk, chunkEntity);
}
