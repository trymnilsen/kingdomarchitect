import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";

export class CollectableProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedWorldItem,
    ): ButtonCollection {
        /*
        TODO: Reimplement collectable provider
        if (selection instanceof SelectedEntityItem) {
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
        }
        */
        return emptySelection;
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
