import { sprites2 } from "../../module/asset/sprite.js";
import { InventoryItem } from "../../data/inventory/inventoryItem.js";
import { SpriteComponent } from "../componentOld/draw/spriteComponent.js";
import { InventoryComponent2 } from "../componentOld/inventory/inventoryComponent.js";
import { ChestComponent } from "../componentOld/resource/chestComponent.js";
import { Entity } from "../entity/entity.js";

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
        },
    );

    const chestComponent = new ChestComponent(initialItems);
    const inventoryComponent = new InventoryComponent2();
    inventoryComponent.isCollectable = true;
    for (const item of initialItems) {
        inventoryComponent.addInventoryItem(item, 1);
    }

    chest.addComponent(inventoryComponent);
    chest.addComponent(chestComponent);
    chest.addComponent(spriteDrawer);

    return chest;
}
