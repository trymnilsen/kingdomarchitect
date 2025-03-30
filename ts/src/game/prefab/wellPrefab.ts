import { sprites2 } from "../../module/asset/sprite.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function wellPrefab(id: string): Entity {
    const well = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.well,
        {
            x: 2,
            y: 2,
        },
        { x: 32, y: 32 },
    );

    well.addComponent(spriteDrawer);

    return well;
}
