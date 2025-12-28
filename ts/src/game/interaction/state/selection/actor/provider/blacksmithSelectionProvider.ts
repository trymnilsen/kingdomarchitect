import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.js";
import { BuildingComponentId } from "../../../../../component/buildingComponent.js";
import { CraftingComponentId } from "../../../../../component/craftingComponent.js";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../../../component/collectableComponent.js";
import { blacksmith } from "../../../../../../data/building/stone/blacksmith.js";
import { sprites2 } from "../../../../../../asset/sprite.js";
import { CraftWithBuildingState } from "../../../crafting/craftWithBuildingState.js";
import { CollectItemJob } from "../../../../../job/collectItemJob.js";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.js";
import { CancelCraftingCommand } from "../../../../../../server/message/command/cancelCraftingCommand.js";

export class BlacksmithSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const buildingComponent =
                selection.entity.getEcsComponent(BuildingComponentId);
            const craftingComponent =
                selection.entity.getEcsComponent(CraftingComponentId);

            if (
                buildingComponent &&
                buildingComponent.building.id === blacksmith.id &&
                craftingComponent
            ) {
                const collectableComponent = selection.entity.getEcsComponent(
                    CollectableComponentId,
                );
                const isCrafting = craftingComponent.activeCrafting !== null;
                const hasItems =
                    collectableComponent !== null &&
                    hasCollectableItems(collectableComponent);

                // Determine which button to show
                if (isCrafting) {
                    // Show Cancel button
                    return {
                        left: [
                            {
                                text: "Cancel",
                                icon: sprites2.empty_sprite,
                                onClick: () => {
                                    stateContext.commandDispatcher(
                                        CancelCraftingCommand(
                                            selection.entity.id,
                                        ),
                                    );
                                },
                            },
                        ],
                        right: [],
                    };
                } else if (hasItems) {
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
                        ],
                        right: [],
                    };
                }
            }
        }

        return emptySelection;
    }
}
