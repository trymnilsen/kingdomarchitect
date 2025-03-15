import { TileChunk } from "../../component/tile/tilesComponent.js";
import { Entity } from "../../entity/entity.js";
import { placeSettlement } from "../item/settlement.js";

export function generateMountains(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
}
