import type { Point } from "../../../common/point.js";
import type { EntityAction } from "../../../module/action/entityAction.js";

export interface UnlockChunkAction extends EntityAction {
    chunkPoint: Point;
}

export function makeUnlockChunkAction(chunkPoint: Point): UnlockChunkAction {
    return {
        id: ["world", unlockChunkId],
        chunkPoint: chunkPoint,
    };
}

export const unlockChunkId = "unlockChunk";
