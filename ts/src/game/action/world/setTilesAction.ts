import type { EntityAction } from "../../../module/action/entityAction.js";
import type { TileChunk } from "../../../module/map/chunk.js";

export interface SetTilesAction extends EntityAction {
    chunk: TileChunk;
}

export function makeSetTilesAction(chunk: TileChunk): SetTilesAction {
    return {
        id: ["world", setTilesId],
        chunk: chunk,
    };
}

export const setTilesId = "setTiles";
