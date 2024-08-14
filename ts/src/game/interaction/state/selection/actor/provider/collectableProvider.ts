import { InventoryComponent2 } from "../../../../../component/inventory/inventoryComponent.js";
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
        _stateContext: StateContext,
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
                            onClick: () => {},
                        },
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }
}
