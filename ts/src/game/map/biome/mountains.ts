import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeSettlement } from "../item/settlementOld.js";

export function generateMountains(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
