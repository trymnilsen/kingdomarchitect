import { spriteRefs } from "../../asset/sprite.ts";
import { generateId } from "../../common/idGenerator.ts";
import { loopAnimation } from "../../rendering/animation/animationGraph.ts";
import { createAnimationComponent } from "../component/animationComponent.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";

export function goblinPrefab(): Entity {
    const entity = new Entity(generateId("goblin"));
    entity.setEcsComponent(createSpriteComponent(spriteRefs.goblin));
    entity.setEcsComponent(createHealthComponent(10, 10));
    return entity;
}

export function goblinFireplace(): Entity {
    const entity = new Entity(generateId("goblinFireplace"));

    const loopingAnimation = loopAnimation(spriteRefs.stone_brazier, 4);
    entity.setEcsComponent(createAnimationComponent(loopingAnimation));
    entity.setEcsComponent(createSpriteComponent(spriteRefs.stone_brazier));
    return entity;
}
