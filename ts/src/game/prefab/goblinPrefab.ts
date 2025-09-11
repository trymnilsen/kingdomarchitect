import { sprites2 } from "../../asset/sprite.js";
import { generateId } from "../../common/idGenerator.js";
import { createHealthComponent } from "../component/healthComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function goblinPrefab(): Entity {
    const entity = new Entity(generateId("goblin"));
    entity.setEcsComponent(createSpriteComponent(sprites2.goblin));
    entity.setEcsComponent(createHealthComponent(10, 10));
    return entity;
}

export function goblinFireplace(): Entity {
    const entity = new Entity(generateId("goblinFireplace"));
    entity.setEcsComponent(createSpriteComponent(sprites2.stone_brazier));
    return entity;
}
