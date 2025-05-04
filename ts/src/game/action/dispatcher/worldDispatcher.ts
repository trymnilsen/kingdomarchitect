import type { EntityAction } from "../../../module/action/entityAction.js";
import { generateChunk } from "../../../module/map/chunkGenerator.js";
import { setChunk, TileComponentId } from "../../component/tileComponent.js";
import type { Entity } from "../../entity/entity.js";
import { setTilesId, type SetTilesAction } from "../world/setTilesAction.js";
import {
    unlockChunkId,
    type UnlockChunkAction,
} from "../world/unlockChunkAction.js";

export function worldDispatcher(action: EntityAction, root: Entity) {
    const actionId = action.id[1];
    switch (actionId) {
        case unlockChunkId:
            generateChunk(root, (action as UnlockChunkAction).chunkPoint);
            break;
        case setTilesId:
            const tileComponent = root.requireEcsComponent(TileComponentId);
            setChunk(tileComponent, (action as SetTilesAction).chunk);
            break;
        default:
            break;
    }
}
