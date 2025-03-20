import { sprites2 } from "../../module/asset/sprite.js";
import { generateId } from "../../common/idGenerator.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function farmPrefab(id: string = generateId("farm")): Entity {
    const farm = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.farm_4,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 },
    );

    farm.addComponent(spriteDrawer);

    return farm;
}
