import { Entity } from "../../entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeSettlement } from "../item/settlement.js";

export function generateSwamp(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
