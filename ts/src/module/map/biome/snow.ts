import { Entity } from "../../../game/entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeSettlement } from "../item/settlement.js";

export function generateSnow(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
