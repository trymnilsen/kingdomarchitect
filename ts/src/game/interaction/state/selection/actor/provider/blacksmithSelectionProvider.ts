import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { SelectedEntityItem } from "../../item/selectedEntityItem.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class BlacksmithSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedEntityItem,
    ): ButtonCollection {
        return emptySelection;
        /*
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
        } else {
            return emptySelection;
        }*/
    }
}
