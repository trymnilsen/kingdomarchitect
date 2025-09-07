import { sprites2 } from "../../asset/sprite.js";
import { generateId } from "../../common/idGenerator.js";
import { createHealthComponent } from "../component/healthComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function trainingDummyPrefab(): Entity {
    const entity = new Entity(generateId("dummy"));
    entity.setEcsComponent(createSpriteComponent(sprites2.training_dummy));
    entity.setEcsComponent(createHealthComponent(10, 10));
    return entity;
}
