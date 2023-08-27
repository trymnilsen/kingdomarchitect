import { sprites2 } from "../../asset/sprite.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function farmPrefab(id: string): Entity {
    const farm = new Entity(id);
    const spriteDrawer = SpriteComponent.createInstance(
        sprites2.farm_4,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 }
    );

    farm.addComponent(spriteDrawer);

    return farm;
}
