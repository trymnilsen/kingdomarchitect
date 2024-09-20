import { CollectableInventoryItemComponent } from "../../../../../component/inventory/collectableInventoryItemComponent.js";
import { InventoryComponent2 } from "../../../../../component/inventory/inventoryComponent.js";
import { JobQueueComponent } from "../../../../../component/job/jobQueueComponent.js";
import { CollectJob } from "../../../../../component/job/jobs/collectJob.js";
import { SelectedEntityItem } from "../../../../../selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class CollectableProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const inventoryComponent =
                selection.entity.getComponent(InventoryComponent2);

            if (
                inventoryComponent &&
                inventoryComponent.items.length > 0 &&
                inventoryComponent.isCollectable
            ) {
                return {
                    left: [
                        ...this.getInventoryComponentItems(
                            selection,
                            stateContext,
                        ),
                        ...this.getCollectableComponentItems(
                            selection,
                            stateContext,
                        ),
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }

    private getCollectableComponentItems(
        selection: SelectedEntityItem,
        stateContext: StateContext,
    ): UIActionbarItem[] {
        const collectableComponent = selection.entity.getComponent(
            CollectableInventoryItemComponent,
        );

        if (collectableComponent && !!collectableComponent.currentItem) {
            return [
                {
                    text: "Collect",
                    onClick: () => {
                        const queue =
                            stateContext.root.requireComponent(
                                JobQueueComponent,
                            );
                        /*
                        queue.addJob(
                            new CollectJob(
                                inventoryComponent.items[0].item,
                                inventoryComponent,
                            ),
                        );*/
                        stateContext.stateChanger.clear();
                    },
                },
            ];
        } else {
            return [];
        }
    }

    private getInventoryComponentItems(
        selection: SelectedEntityItem,
        stateContext: StateContext,
    ): UIActionbarItem[] {
        const inventoryComponent =
            selection.entity.getComponent(InventoryComponent2);

        if (
            inventoryComponent &&
            inventoryComponent.items.length > 0 &&
            inventoryComponent.isCollectable
        ) {
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
                                inventoryComponent.items[0].item,
                                inventoryComponent,
                            ),
                        );
                        stateContext.stateChanger.clear();
                    },
                },
            ];
        } else {
            return [];
        }
    }
}
