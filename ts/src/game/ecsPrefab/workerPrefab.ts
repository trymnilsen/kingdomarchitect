import { sprites2 } from "../../asset/sprite.js";
import { EcsEntity } from "../../ecs/ecsEntity.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { PlayerControllableActorComponent } from "../ecsComponent/actor/playerControllableActorComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { JobComponent } from "../ecsComponent/job/jobComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";

export function workerPrefab(world: EcsWorldScope): EcsEntity {
    const entity = world.createEntity();
    //knight
    const drawableKnightComponent = new DrawableComponent({
        sprite: sprites2.knight,
    });
    const transformKnightComponent = new TransformComponent({ x: 3, y: 4 });
    const colliderComponent = new ColliderComponent();
    world.addComponent(entity, drawableKnightComponent);
    world.addComponent(entity, transformKnightComponent);
    world.addComponent(entity, colliderComponent);
    world.addComponent(entity, new PlayerControllableActorComponent());
    world.addComponent(entity, new JobComponent());

    return entity;
}
