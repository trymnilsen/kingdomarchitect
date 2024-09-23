import { CraftingOutputTag } from "../../../data/inventory/inventoryItemQuantity.js";
import {
    InventoryItemIds,
    inventoryItemsMap,
} from "../../../data/inventory/inventoryItems.js";
import { EntityComponent } from "../entityComponent.js";
import { InventoryComponent2 } from "../inventory/inventoryComponent.js";

/*
 * Should i make some decorator that will notify/error if the components
 * this component depends on is not present? Throwing an error on add might be
 * easier to debug
 * @RequiresComponent(InventoryComponent2)
 */
export class CraftingComponent extends EntityComponent {
    private craftingQueue: InventoryItemIds[] = [];
    private queueTime: number = 0;

    public get lastCraftTime(): number {
        return this.queueTime;
    }

    queueCrafting(itemId: InventoryItemIds) {
        if (this.craftingQueue.length == 0) {
            this.queueTime = this.entity.gameTime.tick;
        }
        this.craftingQueue.push(itemId);
    }

    override onUpdate(tick: number): void {
        if (this.craftingQueue.length == 0) {
            return;
        }

        const timeSinceLastCraft = tick - this.queueTime;
        const inventoryComponent =
            this.entity.requireComponent(InventoryComponent2);
        const hasAlreadyCraftedOuput = inventoryComponent.items.some(
            (item) => item.tag == CraftingOutputTag,
        );

        if (timeSinceLastCraft > 30 && !hasAlreadyCraftedOuput) {
            const toCraft = this.craftingQueue.shift();
            if (!!toCraft) {
                const item = inventoryItemsMap[toCraft];
                //Update the queue time to make the next time use time to craft
                this.queueTime = tick;
                inventoryComponent.addInventoryItem(item, 1, CraftingOutputTag);
            }
        }
    }
}
