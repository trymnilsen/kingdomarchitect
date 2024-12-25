import {
    stoneResource,
    wheatResourceItem,
    woodResourceItem,
} from "../../../data/inventory/items/resources.js";
import { Resource } from "../../../data/resource/resource.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";

export class ResourceComponent extends EcsComponent {
    constructor(public resource: Resource) {
        super();
    }
}
