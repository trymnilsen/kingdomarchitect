import { Sprite2, sprites2 } from "../../../../asset/sprite.js";
import { JSONValue } from "../../../../common/object.js";
import { Point } from "../../../../common/point.js";
import { ItemCategory } from "../../../../data/inventory/inventoryItem.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { EntityComponent } from "../../entityComponent.js";
import { EquipmentComponent } from "../../inventory/equipmentComponent.js";

export class WorkerSpriteComponent extends EntityComponent {
    private tintMe = false;
    override onUpdate(_tick: number): void {
        this.tintMe = !this.tintMe;
    }
    override onDraw(context: RenderScope, screenPosition: Point): void {
        const sprite = this.getSprite();
        let tint: string | undefined = undefined;
        const equipment = this.entity.requireComponent(EquipmentComponent);
        const mainItem = equipment.mainItem.getItem();
        if (mainItem?.category == ItemCategory.Melee) {
            tint = "white";
        }

        context.drawScreenSpaceSprite({
            sprite: sprite,
            x: screenPosition.x + 3,
            y: screenPosition.y + 2,
            targetHeight: 32,
            targetWidth: 32,
            tint: tint,
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
