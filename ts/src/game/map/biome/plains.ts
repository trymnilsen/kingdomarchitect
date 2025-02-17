import { TileChunk } from "../../component/tile/tilesComponent.js";
import { Entity } from "../../entity/entity.js";
import { placeSettlement } from "../item/settlement.js";

export function generatePlains(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
