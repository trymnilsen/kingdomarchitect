import { sprites2 } from "../../asset/sprite.js";
import { Point } from "../../common/point.js";
import { EcsWorldScope } from "../../ecs/ecsWorldScope.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { ColliderComponent } from "../ecsComponent/world/colliderComponent.js";

export function waterPrefab(position: Point, world: EcsWorldScope) {
    const entity = world.createEntity();
    world.addComponent(entity, new TransformComponent(position));
    world.addComponent(
        entity,
        new DrawableComponent(
            {
                color: "blue",
                size: {
                    x: 32,
                    y: 32,
                },
            },
            { x: 3, y: 3 },
        ),
    );
    world.addComponent(entity, new ColliderComponent());
}
