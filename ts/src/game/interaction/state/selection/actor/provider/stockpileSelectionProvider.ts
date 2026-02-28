import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { StockpileComponentId } from "../../../../../component/stockpileComponent.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { InventoryState } from "../../../root/inventory/inventoryState.ts";

export class StockpileSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const buildingComponent =
                selection.entity.getEcsComponent(BuildingComponentId);
            const stockpileComponent =
                selection.entity.getEcsComponent(StockpileComponentId);

            if (buildingComponent && stockpileComponent) {
                return {
                    left: [
                        {
                            text: "Inventory",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.push(
                                    new InventoryState(selection.entity),
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
