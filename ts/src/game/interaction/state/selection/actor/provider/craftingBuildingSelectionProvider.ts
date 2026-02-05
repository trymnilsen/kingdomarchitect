import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { CraftingComponentId } from "../../../../../component/craftingComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../../../component/collectableComponent.ts";
import { sprites2 } from "../../../../../../asset/sprite.ts";
import { CraftWithBuildingState } from "../../../crafting/craftWithBuildingState.ts";
import { CollectItemJob } from "../../../../../job/collectItemJob.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";
import { InventoryState } from "../../../root/inventory/inventoryState.ts";

export class CraftingBuildingSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const buildingComponent =
                selection.entity.getEcsComponent(BuildingComponentId);
            const craftingComponent =
                selection.entity.getEcsComponent(CraftingComponentId);

            if (buildingComponent && craftingComponent) {
                const collectableComponent = selection.entity.getEcsComponent(
                    CollectableComponentId,
                );
                const hasItems =
                    collectableComponent !== null &&
                    hasCollectableItems(collectableComponent);

                const inventory = {
                    text: "Ledger",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new InventoryState(selection.entity),
                        );
                    },
                };

                // Determine which button to show
                if (hasItems) {
                    // Show Collect button
                    return {
                        left: [
                            {
                                text: "Collect",
                                icon: sprites2.empty_sprite,
                                onClick: () => {
                                    const job = CollectItemJob(
                                        selection.entity,
                                    );
                                    stateContext.commandDispatcher(
                                        QueueJobCommand(job),
                                    );
                                },
                            },
                            inventory,
                        ],
                        right: [],
                    };
                } else {
                    // Show Craft button
                    return {
                        left: [
                            {
                                text: "Craft",
                                icon: sprites2.empty_sprite,
                                onClick: () => {
                                    stateContext.stateChanger.replace(
                                        new CraftWithBuildingState(
                                            selection.entity,
                                        ),
                                    );
                                },
                            },
                            inventory,
                        ],
                        right: [],
                    };
                }
            }
        }

        return emptySelection;
    }
}
