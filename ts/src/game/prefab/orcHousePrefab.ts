import { sprites2 } from "../../asset/sprite.js";
import { generateId } from "../../common/idGenerator.js";
import { SpriteComponent } from "../component/draw/spriteComponent.js";
import { Entity } from "../entity/entity.js";

export function orcHousePrefab(id: string = generateId("orcHouse")): Entity {
    const well = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.goblin_house,
        {
            x: 2,
            y: 2,
        },
        { x: 32, y: 32 },
    );

    well.addComponent(spriteDrawer);

    return well;
}
