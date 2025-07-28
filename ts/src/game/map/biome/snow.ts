import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../../../module/world/chunk.js";
import { placeSettlement } from "../item/settlement.js";

export function generateSnow(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
