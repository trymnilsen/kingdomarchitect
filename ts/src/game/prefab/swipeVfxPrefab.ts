import { spriteRefs } from "../../../generated/sprites.ts";
import { generateId } from "../../common/idGenerator.ts";
import { zeroPoint } from "../../common/point.js";
import { createDespawnTimerComponent } from "../component/despawnTimerComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";

export function swipeVfxPrefab(now: number): Entity {
    const entity = new Entity(generateId("swipeVfx"));
    entity.setEcsComponent(createDespawnTimerComponent(now, 1));
    entity.setEcsComponent(
        createSpriteComponent(
            spriteRefs.swipe_effect,
            zeroPoint(),
            { x: 16, y: 16 },
            undefined,
            1,
        ),
    );
    return entity;
}
