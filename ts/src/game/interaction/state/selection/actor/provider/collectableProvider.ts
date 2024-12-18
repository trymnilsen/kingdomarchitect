import { CraftingOutputTag } from "../../../../../../data/inventory/inventoryItemQuantity.js";
import { InventoryComponent2 } from "../../../../../component/inventory/inventoryComponent.js";
import { JobQueueComponent } from "../../../../../component/job/jobQueueComponent.js";
import { CollectJob } from "../../../../../component/job/jobs/collectJob.js";
import { SelectedEntityItem } from "../../item/selectedEntityItem.js";
import { SelectedWorldItem } from "../../item/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class CollectableProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedEntityItem,
    ): ButtonCollection {
        return emptySelection;
        /*
            const inventoryComponent =
                selection.entity.getComponent(InventoryComponent2);

            if (
                inventoryComponent &&
                inventoryComponent.items.length > 0 &&
                inventoryComponent.isCollectable
            ) {
                return {
                    left: this.getInventoryComponentItems(
                        selection,
                        stateContext,
                    ),
                    right: [],
                };
            }
        */
    }

    /*
    private getInventoryComponentItems(
        selection: SelectedEntityItem,
        stateContext: StateContext,
    ): UIActionbarItem[] {
        const inventoryComponent =
            selection.entity.getComponent(InventoryComponent2);

        if (!inventoryComponent || !inventoryComponent.isCollectable) {
            return [];
        }

        const itemToCollect = inventoryComponent.items.filter(
            (entry) => entry.tag == CraftingOutputTag,
        )[0];

        if (!!itemToCollect) {
            return [
                {
                    text: "Collect",
                    onClick: () => {
                        const queue =
                            stateContext.root.requireComponent(
                                JobQueueComponent,
                            );

                        queue.addJob(
                            new CollectJob(
                                itemToCollect.item,
                                inventoryComponent,
                                CraftingOutputTag,
                            ),
                        );

                        stateContext.stateChanger.clear();
                    },
                },
            ];
        } else {
            return [];
        }
    }*/
}
