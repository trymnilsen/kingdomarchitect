import { zeroPoint } from "../../common/point.ts";
import { generateId } from "../../common/idGenerator.ts";
import { type NaturalResource } from "../../data/inventory/items/naturalResource.ts";
import { createResourceComponent } from "../component/resourceComponent.ts";
import { createRegrowComponent } from "../component/regrowComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";
import { createHealthComponent } from "../component/healthComponent.ts";

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
