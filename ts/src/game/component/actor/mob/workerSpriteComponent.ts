import { Sprite2, sprites2 } from "../../../../module/asset/sprite.js";
import { JSONValue } from "../../../../common/object.js";
import { Point } from "../../../../common/point.js";
import { ItemCategory } from "../../../../data/inventory/inventoryItem.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { EntityComponent } from "../../entityComponent.js";
import { EquipmentComponent } from "../../inventory/equipmentComponent.js";

export class WorkerSpriteComponent extends EntityComponent {
    override onDraw(context: RenderScope, screenPosition: Point): void {
        const sprite = this.getSprite();

        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 3,
            y: screenPosition.y + 2,
            targetHeight: 32,
            targetWidth: 32,
        });
    }

    public getSprite(): Sprite2 {
        const equipment = this.entity.requireComponent(EquipmentComponent);
        const mainItem = equipment.mainItem.getItem();
        if (mainItem) {
            switch (mainItem.category) {
                case ItemCategory.Melee:
                    return sprites2.knight;
                case ItemCategory.Ranged:
                    return sprites2.knight;
                case ItemCategory.Magic:
                    return sprites2.mage;
                case ItemCategory.Productivity:
                    return sprites2.worker;
                default:
                    return sprites2.dweller;
            }
        } else {
            return sprites2.dweller;
        }
    }
}
