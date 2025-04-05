import { generateId } from "../../common/idGenerator.js";
import { sprites2 } from "../../module/asset/sprite.js";
import { SpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function workerPrefab(): Entity {
    const entity = new Entity(generateId("worker"));
    const spriteComponent = new SpriteComponent();
    spriteComponent.sprite = sprites2.knight;
    entity.addEcsComponent(spriteComponent);

    return entity;
}
