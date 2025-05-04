import type { ActionDispatcher } from "../../../module/action/actionDispatcher.js";
import type { EntityAction } from "../../../module/action/entityAction.js";
import type { Entity } from "../../entity/entity.js";
import { actorDispatcher } from "./actorDispatcher.js";
import { buildingDispatcher } from "./buildingDispatcher.js";
import { worldDispatcher } from "./worldDispatcher.js";

export function createServerDispatcher(root: Entity): ActionDispatcher {
    return (action: EntityAction) => {
        if (action.id.length < 2) {
            return;
        }

        const category = action.id[0];
        switch (category) {
            case "world":
                worldDispatcher(action, root);
                break;
            case "actor":
                actorDispatcher(action, root);
                break;
            case "building":
                buildingDispatcher(action, root);
                break;
            default:
                break;
        }
    };
}
