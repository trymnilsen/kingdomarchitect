import { Sprite2 } from "../../../asset/sprite.js";
import { Point } from "../../../common/point.js";
import { InventoryItem } from "../../../data/inventory/inventoryItem.js";
import { CraftingOutputTag } from "../../../data/inventory/inventoryItemQuantity.js";
import { RenderScope } from "../../../rendering/renderContext.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { EntityComponent } from "../entityComponent.js";
import { InventoryComponent2 } from "./inventoryComponent.js";

export class JumpingInventoryItem extends EntityComponent {
    private offset: number = 0;
    private sprite: Sprite2 | null = null;
    override onUpdate(_tick: number): void {
        if (this.offset == 0) {
            this.offset = 8;
        } else {
            this.offset = 0;
        }

        const inventoryComponent =
            this.entity.getComponent(InventoryComponent2);

        if (!!inventoryComponent) {
            const item = inventoryComponent.items.filter(
                (entry) => entry.tag == CraftingOutputTag,
            )[0];

            if (!!item) {
                this.sprite = item.item.asset;
            } else {
                // Make sure we reset the sprite reference so we dont show any
                // items that have later been removed from the inv
                this.sprite = null;
            }
        }
    }
    override onDraw(
        context: RenderScope,
        screenPosition: Point,
        _visibilityMap: RenderVisibilityMap,
    ): void {
        if (this.sprite) {
            context.drawScreenSpaceSprite({
                sprite: this.sprite,
                x: screenPosition.x,
                y: screenPosition.y + this.offset,
            });
        }
    }
}
