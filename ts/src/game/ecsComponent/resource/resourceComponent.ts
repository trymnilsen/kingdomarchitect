import {
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../data/inventory/items/resources.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";

export type ResourceType =
    | typeof wheatResourceItem
    | typeof stoneResource
    | typeof woodResourceItem;

export class ResourceComponent extends EcsComponent {
    constructor(public resource: ResourceType) {
        super();
    }
}
