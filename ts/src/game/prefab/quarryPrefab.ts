import { sprites2 } from "../../module/asset/sprite.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function quarryPrefab(id: string): Entity {
    const stone = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.rocks,
        {
            x: 3,
            y: 2,
        },
        { x: 32, y: 32 },
    );

    stone.addComponent(spriteDrawer);

    return stone;
}
