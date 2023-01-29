import { farm_sprite3 } from "../../../asset/sprites/farmSprite";
import { SpriteComponent } from "../component/draw/spriteComponent";
import { Entity } from "../entity/entity";

export function farmPrefab(id: string): Entity {
    const farm = new Entity(id);
    const spriteDrawer = new SpriteComponent(farm_sprite3, { x: 3, y: 2 });

    farm.addComponent(spriteDrawer);

    return farm;
}
