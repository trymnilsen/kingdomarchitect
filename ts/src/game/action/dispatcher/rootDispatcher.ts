import type { ActionDispatcher } from "../../../module/action/actionDispatcher.js";
import type { EntityAction } from "../../../module/action/entityAction.js";
import { generateChunk } from "../../../module/map/chunkGenerator.js";
import type { Entity } from "../../entity/entity.js";
import {
    unlockChunkId,
    type UnlockChunkAction,
} from "../world/unlockChunkAction.js";

export function createRootDispatcher(root: Entity): ActionDispatcher {
    return (action: EntityAction) => {
        if (action.id.length < 2) {
            return;
        }

        const category = action.id[0];
        switch (category) {
            case "world":
                worldDispatcher(action, root);
                break;
        }
    };
}

function worldDispatcher(action: EntityAction, root: Entity) {
    const actionId = action.id[1];
    switch (actionId) {
        case unlockChunkId:
            generateChunk(root, (action as UnlockChunkAction).chunkPoint);
            break;
        default:
            break;
    }
}
