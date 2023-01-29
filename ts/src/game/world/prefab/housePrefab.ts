import { sprites } from "../../../asset/sprite";
import { SpriteComponent } from "../component/draw/spriteComponent";
import { Entity } from "../entity/entity";

export function housePrefab(id: string): Entity {
    const house = new Entity(id);
    const spriteDrawer = new SpriteComponent(sprites.woodHouse, { x: 3, y: 2 });

    house.addComponent(spriteDrawer);

    return house;
}
