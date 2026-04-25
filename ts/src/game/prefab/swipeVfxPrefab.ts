import { spriteRefs } from "../../../generated/sprites.js";
import { generateId } from "../../common/idGenerator.js";
import { spriteRenderer } from "../../rendering/items/sprite.js";
import { createDespawnTimerComponent } from "../component/despawnTimerComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function swipeVfxPrefab(now: number): Entity {
    const entity = new Entity(generateId("swipeVfx"));
    entity.setEcsComponent(createDespawnTimerComponent(now, 5));
    entity.setEcsComponent(createSpriteComponent(spriteRefs.swipe_effect));
    return entity;
}
