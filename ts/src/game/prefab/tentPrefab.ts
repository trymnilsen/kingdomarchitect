import { sprites2 } from "../../asset/sprite.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function tentPrefab(id: string): Entity {
    const tent = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.tent_flag,
        {
            x: 2,
            y: 2,
        },
        { x: 32, y: 32 },
    );

    tent.addComponent(spriteDrawer);

    return tent;
}
