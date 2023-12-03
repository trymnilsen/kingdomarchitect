import { Sprite2, sprites2 } from "../../../../asset/sprite.js";
import { JSONValue } from "../../../../common/object.js";
import { Point } from "../../../../common/point.js";
import { ItemCategory } from "../../../../data/inventory/inventoryItem.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { EntityComponent, StatelessComponent } from "../../entityComponent.js";
import { EquipmentComponent } from "../../inventory/equipmentComponent.js";

export class WorkerSpriteComponent extends StatelessComponent {
    override onDraw(context: RenderContext, screenPosition: Point): void {
        const sprite = this.getSprite();
        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 3,
            y: screenPosition.y + 2,
            targetHeight: 32,
            targetWidth: 32,
        });
    }

    private getSprite(): Sprite2 {
        const equipment = this.entity.requireComponent(EquipmentComponent);
        const mainItem = equipment.mainItem;
        if (mainItem) {
            switch (mainItem.category) {
                case ItemCategory.Melee:
                    return sprites2.knight;
                case ItemCategory.Ranged:
                    return sprites2.bowman;
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
