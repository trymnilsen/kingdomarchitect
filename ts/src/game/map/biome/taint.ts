import { Entity } from "../../entity/entity.ts";
import type { TileChunk } from "../chunk.ts";
import { placeSettlement } from "../item/settlementOld.ts";

export function generateTaint(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
