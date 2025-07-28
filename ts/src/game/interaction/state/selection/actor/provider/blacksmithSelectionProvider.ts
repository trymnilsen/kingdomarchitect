import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class BlacksmithSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedWorldItem,
    ): ButtonCollection {
        /*
        TODO: Reimplement this selection provider
        if (selection instanceof SelectedEntityItem) {
            const buildingComponent =
                selection.entity.getComponent(BuildingComponent);

            if (
                buildingComponent &&
                buildingComponent.building.id == blacksmith.id
            ) {
                return {
                    left: [
                        {
                            text: "Craft",
                            icon: sprites2.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.replace(
                                    new CraftWithBuildingState(
                                        buildingComponent,
                                    ),
                                );
                            },
                        },
                    ],
                    right: [],
                };
            } else {
                return emptySelection;
            }
        } */
        return emptySelection;
    }
}
