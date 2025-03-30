import { TileChunk } from "../../componentOld/tile/tilesComponent.js";
import { Entity } from "../../entity/entity.js";
import { placeSettlement } from "../item/settlement.js";

export function generateTaint(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
