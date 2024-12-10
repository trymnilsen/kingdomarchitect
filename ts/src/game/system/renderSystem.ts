import { EcsRenderEvent } from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem, QueryData } from "../../ecs/ecsSystem.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { TileSize } from "../map/tile.js";

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
                x:
                    entity.transform.position.x * TileSize +
                    entity.drawable.offset.x,
                y:
                    entity.transform.position.y * TileSize +
                    entity.drawable.offset.y,
                targetWidth: 32,
                targetHeight: 32,
            });
        }
    }
}
