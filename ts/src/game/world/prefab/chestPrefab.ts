import { sprites2 } from "../../../asset/sprite";
import { InventoryItem } from "../../../data/inventory/inventoryItem";
import { SpriteComponent } from "../component/draw/spriteComponent";
import { ChestComponent } from "../component/resource/chestComponent";
import { Entity } from "../entity/entity";

export function chestPrefab(id: string, initialItems: InventoryItem[]): Entity {
    const chest = new Entity(id);
    const spriteDrawer = new SpriteComponent(
        sprites2.chest_gold,
        {
            x: 3,
            y: 0,
        },
        {
            x: 32,
            y: 32,
        }
    );
    const chestComponent = new ChestComponent(initialItems);

    chest.addComponent(chestComponent);
    chest.addComponent(spriteDrawer);

    return chest;
}
