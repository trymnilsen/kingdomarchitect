import { generateId } from "../../../common/idGenerator.js";
import { encodePosition } from "../../../common/point.js";
import { SparseSet } from "../../../common/structure/sparseSet.js";
import { TileChunk } from "../../component/tile/tilesComponent.js";
import { Entity } from "../../entity/entity.js";
import { placeRocks } from "../item/rocks.js";
import { placeSettlement } from "../item/settlement.js";
import { spawnTree } from "../item/vegetation.js";

export function generateForrest(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
    spawnTree(16, { x: chunk.chunkX, y: chunk.chunkY }, rootEntity);
    placeRocks(chunk, rootEntity);
}
