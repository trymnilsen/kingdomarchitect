import { InventoryComponent2 } from "../../../../../component/inventory/inventoryComponent.js";
import { JobQueueComponent } from "../../../../../component/job/jobQueueComponent.js";
import { CollectJob } from "../../../../../component/job/jobs/collectJob.js";
import { SelectedEntityItem } from "../../../../../selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
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
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }
}
