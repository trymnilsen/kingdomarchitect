import { ReadableSet } from "../../common/structure/sparseSet.js";
import { EcsRenderEvent } from "../../ecs/ecsEvent.js";
import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { DrawableComponent } from "../ecsComponent/drawable/drawableComponent.js";
import { TransformComponent } from "../ecsComponent/transformComponent.js";

export function createRenderSystem(): EcsSystem {
    return createSystem({
        drawable: DrawableComponent,
        transform: TransformComponent,
    })
        .onEvent(EcsRenderEvent, (query, event) => {
            renderDrawables(query.drawable, event.renderScope);
        })
        .build();
}

function renderDrawables(
    drawables: ReadableSet<DrawableComponent>,
    renderScope: RenderScope,
) {
    for (let i = 0; i < drawables.size; i++) {
        const drawable = drawables.elementAt(i);
        if (drawable.sprite) {
            renderScope.drawSprite({
                sprite: drawable.sprite,
                x: 0,
                y: 0,
            });
        }
    }
}
