import { sprites2 } from "../../../../../../asset/sprite.js";
import { blacksmith } from "../../../../../../data/building/stone/blacksmith.js";
import { BuildingComponent } from "../../../../../component/building/buildingComponent.js";
import { SelectedEntityItem } from "../../../../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../../../selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { CraftWithBuildingState } from "../../../craft/craftWithBuildingState.js";
import { BuildingState } from "../../../root/building/buildingState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class BlacksmithSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
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
        } else {
            return emptySelection;
        }
    }
}
