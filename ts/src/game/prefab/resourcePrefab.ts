import { type NaturalResource } from "../../data/inventory/items/naturalResource.js";
import { createResourceComponent } from "../component/resourceComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function resourcePrefab(item: NaturalResource): Entity {
    const entity = new Entity("resource");
    const resource = createResourceComponent(item);
    const spriteComponent = createSpriteComponent(item.asset);

    entity.setEcsComponent(resource);
    entity.setEcsComponent(spriteComponent);
    return entity;
}
