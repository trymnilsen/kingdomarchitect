import { Point } from "../../common/point.js";
import { Building } from "../../data/building/building.js";
import { EcsEntity } from "../../ecs/ecsEntity.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { BuildingComponent } from "../ecsComponent/building/buildingComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";

export function buildingPrefab(
    world: EcsWorldScope,
    building: Building,
    initialPosition: Point,
): EcsEntity {
    const entity = world.createEntity();
    world.addComponent(entity, new TransformComponent(initialPosition));
    world.addComponent(entity, new BuildingComponent(building, false));
    world.addComponent(
        entity,
        new DrawableComponent(building.icon, { x: 2, y: 2 }),
    );
    world.addComponent(entity, new ColliderComponent());
    return entity;
}
