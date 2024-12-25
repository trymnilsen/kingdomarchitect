import { Sprite2, sprites2 } from "../../asset/sprite.js";
import { Point } from "../../common/point.js";
import {
    stoneResource,
    wheatResourceItem,
} from "../../data/inventory/items/resources.js";
import { Resource } from "../../data/resource/resource.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { ResourceComponent } from "../ecsComponent/resource/resourceComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";

export function resourcePrefab(
    world: EcsWorldScope,
    resource: Resource,
    initialPosition: Point,
) {
    const entity = world.createEntity();
    world.addComponent(entity, new TransformComponent(initialPosition));
    world.addComponent(entity, new ColliderComponent());
    world.addComponent(entity, new ResourceComponent(resource));
    world.addComponent(
        entity,
        new DrawableComponent({ sprite: resource.asset }),
    );
    return entity;
}
