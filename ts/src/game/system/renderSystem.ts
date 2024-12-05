import { EcsRenderEvent } from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem, QueryData } from "../../ecs/ecsSystem.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { TransformComponent } from "../ecsComponent/transformComponent.js";

const query = {
    drawable: DrawableComponent,
    transform: TransformComponent,
};

export function createRenderSystem(): EcsSystem {
    return createSystem(query)
        .onEvent(EcsRenderEvent, (query, event) => {
            renderDrawables(query, event.renderScope);
        })
        .build();
}

function renderDrawables(
    entities: Iterable<QueryData<typeof query>>,
    renderScope: RenderScope,
) {
    for (const entity of entities) {
        if (entity.drawable.sprite) {
            renderScope.drawSprite({
                sprite: entity.drawable.sprite,
                x: 0,
                y: 0,
            });
        }
    }
}
