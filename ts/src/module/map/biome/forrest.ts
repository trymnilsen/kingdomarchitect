import { generateId } from "../../../common/idGenerator.js";
import { encodePosition } from "../../../common/point.js";
import { SparseSet } from "../../../common/structure/sparseSet.js";
import { Entity } from "../../../game/entity/entity.js";
import type { TileChunk } from "../chunk.js";
import { placeRocks } from "../item/rocks.js";
import { placeSettlement } from "../item/settlement.js";
import { spawnTree } from "../item/vegetation.js";

export function generateForrest(chunk: TileChunk, rootEntity: Entity) {
    placeSettlement(chunk, rootEntity);
    //spawnTree(16, { x: chunk.chunkX, y: chunk.chunkY }, rootEntity);
    placeRocks(chunk, rootEntity);
}
