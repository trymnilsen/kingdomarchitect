import { sprites2 } from "../../asset/sprite.js";
import { generateId } from "../../common/idGenerator.js";
import { loopAnimation } from "../../rendering/animation/animationGraph.js";
import { createAnimationComponent } from "../component/animationComponent.js";
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

    const loopingAnimation = loopAnimation(sprites2.stone_brazier, 4);
    entity.setEcsComponent(createAnimationComponent(loopingAnimation));
    entity.setEcsComponent(createSpriteComponent(sprites2.stone_brazier));
    return entity;
}
