import { sprites2 } from "../../asset/sprite.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function farmPrefab(id: string): Entity {
    const farm = new Entity(id);
    const spriteDrawer = new SpriteComponent(sprites2.farm_4, {
        x: 3,
        y: 2,
    });

    farm.addComponent(spriteDrawer);

    return farm;
}
