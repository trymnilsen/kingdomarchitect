import { generateId } from "../../common/idGenerator.js";
import { sprites2 } from "../../module/asset/sprite.js";
import { createEquipmentComponent } from "../component/equipmentComponent.js";
import { createJobRunnerComponent } from "../component/jobRunnerComponent.js";
import { createPlayerUnitComponent } from "../component/playerUnitComponent.js";
import { createSpriteComponent } from "../component/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function workerPrefab(): Entity {
    const entity = new Entity(generateId("worker"));
    const spriteComponent = createSpriteComponent(sprites2.knight);
    entity.setEcsComponent(spriteComponent);
    entity.setEcsComponent(createPlayerUnitComponent());
    entity.setEcsComponent(createJobRunnerComponent());
    entity.setEcsComponent(createEquipmentComponent());
    return entity;
}
