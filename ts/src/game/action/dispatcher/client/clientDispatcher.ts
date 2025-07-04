import type { ActionDispatcher } from "../../../../module/action/actionDispatcher.js";
import type { EntityAction } from "../../../../module/action/entityAction.js";
import type { Entity } from "../../../entity/entity.js";
import { actorDispatcher } from "../common/actorDispatcher.js";
import { clientWorldDispatcher } from "./clientWorldDispatcher.js";

export function createClientDispatcher(root: Entity): ActionDispatcher {
    return (action: EntityAction) => {
        if (action.id.length < 2) {
            return;
        }

        const category = action.id[0];
        switch (category) {
            case "world":
                clientWorldDispatcher(action, root);
                break;
            case "actor":
                actorDispatcher(action, root);
                break;
            default:
                break;
        }
    };
}
