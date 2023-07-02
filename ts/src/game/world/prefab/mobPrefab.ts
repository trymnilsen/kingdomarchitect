import { sprites2 } from "../../../asset/sprite.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function mobPrefab(id: string): Entity {
    const goblin = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.goblin,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 }
    );

    goblin.addComponent(spriteDrawer);

    return goblin;
}
