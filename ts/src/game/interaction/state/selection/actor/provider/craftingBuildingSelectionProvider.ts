import { type SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { type StateContext } from "../../../../handler/stateContext.ts";
import { type ButtonCollection } from "../../../../view/buttonCollection.ts";
import type { UIActionbarItem } from "../../../../view/uiActionbar.ts";
import {
    type ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import {
    CraftingComponentId,
    CraftingOutputPolicy,
} from "../../../../../component/craftingComponent.ts";
import type { Entity } from "../../../../../entity/entity.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { SetCraftingOutputPolicyCommand } from "../../../../../../server/message/command/setCraftingOutputPolicyCommand.ts";
import { CraftWithBuildingState } from "../../../crafting/craftWithBuildingState.ts";
import { InventoryState } from "../../../root/inventory/inventoryState.ts";
import { singleInventoryFilter } from "../../../../../building/stockFilter.ts";

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
                return {
                    left: [
                        {
                            text: "Craft",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.replace(
                                    new CraftWithBuildingState(
                                        selection.entity,
                                    ),
                                );
                            },
                        },
                        {
                            text: "Ledger",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.push(
                                    new InventoryState(
                                        selection.entity,
                                        singleInventoryFilter(
                                            selection.entity.id,
                                            "This building",
                                        ),
                                    ),
                                );
                            },
                        },
                        this.outputButton(stateContext, selection.entity),
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }

    /** Sets what the crafter does with finished goods: carry them to a store, or leave them for haulers. */
    private outputButton(
        stateContext: StateContext,
        building: Entity,
    ): UIActionbarItem {
        const setPolicy = (policy: CraftingOutputPolicy) => () => {
            stateContext.commandDispatcher(
                SetCraftingOutputPolicyCommand(building, policy),
            );
        };
        return {
            text: "Output",
            icon: spriteRefs.empty_sprite,
            children: [
                {
                    text: "Haul",
                    icon: spriteRefs.empty_sprite,
                    onClick: setPolicy(CraftingOutputPolicy.Haul),
                },
                {
                    text: "Drop",
                    icon: spriteRefs.empty_sprite,
                    onClick: setPolicy(CraftingOutputPolicy.Drop),
                },
            ],
        };
    }
}
