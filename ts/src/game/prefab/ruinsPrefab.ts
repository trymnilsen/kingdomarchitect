import { sprites2 } from "../../asset/sprite.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function ruinsPrefab(id: string): Entity {
    const ruinsPrefab = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.ruins,
        {
            x: 3,
            y: 0,
        },
        {
            x: 32,
            y: 32,
        },
    );

    ruinsPrefab.addComponent(spriteDrawer);

    return ruinsPrefab;
}
