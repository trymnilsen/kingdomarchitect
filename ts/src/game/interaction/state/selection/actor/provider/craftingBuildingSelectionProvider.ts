import { type SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { type StateContext } from "../../../../handler/stateContext.ts";
import { type ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    type ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { CraftingComponentId } from "../../../../../component/craftingComponent.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
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
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }
}
