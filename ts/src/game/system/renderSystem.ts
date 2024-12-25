import { nameof } from "../../common/nameof.js";
import { createSystem, EcsSystem, QueryData } from "../../ecs/ecsSystem.js";
import { EcsRenderEvent } from "../../ecs/event/ecsRenderEvent.js";
import { TransformComponent } from "../../ecs/transformComponent.js";
import { RenderScope } from "../../rendering/renderScope.js";
import {
    Drawable,
    DrawableComponent,
    ShapeDrawable,
    SpriteDrawable,
} from "../ecsComponent/drawable/drawableComponent.js";
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
        const drawable = entity.drawable.drawable;
        const x =
            entity.transform.position.x * TileSize + entity.drawable.offset.x;
        const y =
            entity.transform.position.y * TileSize + entity.drawable.offset.y;
        if (isSpriteDrawable(drawable)) {
            renderScope.drawSprite({
                sprite: drawable.sprite,
                x: x,
                y: y,
                targetWidth: 32,
                targetHeight: 32,
            });
        } else if (isShapeDrawable(drawable)) {
            renderScope.drawRectangle({
                x: x,
                y: y,
                width: drawable.size.x,
                height: drawable.size.y,
                fill: drawable.color,
            });
        }
    }
}

function isSpriteDrawable(drawable: Drawable): drawable is SpriteDrawable {
    return nameof<SpriteDrawable>("sprite") in drawable;
}

function isShapeDrawable(drawable: Drawable): drawable is ShapeDrawable {
    return (
        nameof<ShapeDrawable>("color") in drawable &&
        nameof<ShapeDrawable>("size") in drawable
    );
}
