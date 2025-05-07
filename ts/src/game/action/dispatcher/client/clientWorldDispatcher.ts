import type { EntityAction } from "../../../../module/action/entityAction.js";
import { generateChunk } from "../../../../module/map/chunkGenerator.js";
import { setChunk, TileComponentId } from "../../../component/tileComponent.js";
import type { Entity } from "../../../entity/entity.js";
import { setTilesId, type SetTilesAction } from "../../world/setTilesAction.js";
import {
    unlockChunkId,
    type UnlockChunkAction,
} from "../../world/unlockChunkAction.js";

export function clientWorldDispatcher(action: EntityAction, root: Entity) {
    const actionId = action.id[1];
    const tileComponent = root.requireEcsComponent(TileComponentId);
    switch (actionId) {
        case unlockChunkId:
            const chunkPoint = (action as UnlockChunkAction).chunkPoint;
            setChunk(tileComponent, {
                chunkX: chunkPoint.x,
                chunkY: chunkPoint.y,
            });
            break;
        case setTilesId:
            setChunk(tileComponent, (action as SetTilesAction).chunk);
            break;
        default:
            break;
    }
}
