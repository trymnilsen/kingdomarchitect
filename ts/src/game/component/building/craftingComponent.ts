import { InventoryItemTag } from "../../../data/inventory/inventoryItemQuantity.js";
import {
    InventoryItemIds,
    inventoryItemsMap,
} from "../../../data/inventory/inventoryItems.js";
import { EntityComponent } from "../entityComponent.js";
import { CollectableInventoryItemComponent } from "../inventory/collectableInventoryItemComponent.js";
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

    queueCrafting(itemId: InventoryItemIds) {
        //If there is no queue set, update the queuetime to make the item at
        //the right time
        if (this.craftingQueue.length == 0) {
            this.queueTime = this.entity.gameTime.tick;
        }
        this.craftingQueue.push(itemId);
    }

    override onUpdate(tick: number): void {
        const timeSpentCrafting = tick - this.queueTime;
        const inventory = this.entity.requireComponent(InventoryComponent2);
        const collectableComponent = this.entity.requireComponent(
            CollectableInventoryItemComponent,
        );

        //The inventory might have the two types of items in its inventory
        //The crafted item that we want to show
        //items needed for crafting. Should we keep crafting items in this
        //component? That makes it more complex for a building to drop its items
        //if destroyed?
        //Should there be a "ProducedItemComponent" that combines jumping?
        //Maybe a collectable component?
        if (timeSpentCrafting > 30 && !collectableComponent.currentItem) {
            const toCraft = this.craftingQueue.shift();
            if (!!toCraft) {
                const item = inventoryItemsMap[toCraft];
                //Update the queue time to make the next time use time to craft
                this.queueTime = tick;
                collectableComponent.currentItem = item;
            }
        }
    }
}
