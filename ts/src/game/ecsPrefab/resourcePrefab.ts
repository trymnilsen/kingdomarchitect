import { Sprite2, sprites2 } from "../../asset/sprite.js";
import { Point } from "../../common/point.js";
import {
    stoneResource,
    wheatResourceItem,
} from "../../data/inventory/items/resources.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import {
    ResourceComponent,
    ResourceType,
} from "../ecsComponent/resource/resourceComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";

export function resourcePrefab(
    world: EcsWorldScope,
    resource: ResourceType,
    initialPosition: Point,
) {
    const entity = world.createEntity();
    world.addComponent(entity, new TransformComponent(initialPosition));
    world.addComponent(entity, new ColliderComponent());
    world.addComponent(entity, new ResourceComponent(resource));
    world.addComponent(
        entity,
        new DrawableComponent(resourceToDrawable(resource)),
    );
    return entity;
}

function resourceToDrawable(resource: ResourceType): Sprite2 {
    switch (resource.id) {
        case "stone":
            return sprites2.stone;
        case "wheat":
            return sprites2.farm_2;
        case "wood":
            return sprites2.tree_2;
    }
}
