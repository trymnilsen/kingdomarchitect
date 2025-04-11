import {
    treeResource,
    type NaturalResource,
} from "../../data/inventory/items/naturalResource.js";
import { ResourceComponent } from "../component/resourceComponent.js";
import { SpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function resourcePrefab(item: NaturalResource): Entity {
    const entity = new Entity("resource");
    const resource = new ResourceComponent();
    const spriteComponent = new SpriteComponent();
    resource.resource = item;
    spriteComponent.sprite = item.asset;

    entity.addEcsComponent(resource);
    entity.addEcsComponent(spriteComponent);
    return entity;
}
