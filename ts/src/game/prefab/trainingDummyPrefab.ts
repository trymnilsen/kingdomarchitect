import { spriteRefs } from "../../asset/sprite.ts";
import { generateId } from "../../common/idGenerator.ts";
import { createHealthComponent } from "../component/healthComponent.ts";
import { createSpriteComponent } from "../component/spriteComponent.ts";
import { Entity } from "../entity/entity.ts";

export function trainingDummyPrefab(): Entity {
    const entity = new Entity(generateId("dummy"));
    entity.setEcsComponent(createSpriteComponent(spriteRefs.training_dummy));
    entity.setEcsComponent(createHealthComponent(10, 10));
    return entity;
}
