import { zeroPoint } from "../../common/point.js";
import { generateId } from "../../common/idGenerator.js";
import { type NaturalResource } from "../../data/inventory/items/naturalResource.js";
import { createResourceComponent } from "../component/resourceComponent.js";
import { createRegrowComponent } from "../component/regrowComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";
import { createHealthComponent } from "../component/healthComponent.js";

export function resourcePrefab(item: NaturalResource): Entity {
    const entity = new Entity(generateId("resource"));
    const resource = createResourceComponent(item.id);
    const spriteComponent = createSpriteComponent(item.asset, zeroPoint());

    entity.setEcsComponent(resource);
    entity.setEcsComponent(spriteComponent);
    entity.setEcsComponent(createHealthComponent(100, 100));

    // Add regrow component if resource has regrow lifecycle
    if (item.lifecycle.type === "Regrow") {
        entity.setEcsComponent(createRegrowComponent(item.id));
    }

    return entity;
}
