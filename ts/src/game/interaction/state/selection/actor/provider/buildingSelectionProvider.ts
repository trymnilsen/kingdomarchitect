import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.js";
import { BuildingComponentId } from "../../../../../component/buildingComponent.js";
import { tavern } from "../../../../../../data/building/food/tavern.js";
import { sprites2 } from "../../../../../../asset/sprite.js";
import { LoadSpaceCommand } from "../../../../../../server/message/command/enterSpaceCommand.js";

export class BuildingSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const buildingComponent =
                selection.entity.getEcsComponent(BuildingComponentId);

            if (
                buildingComponent &&
                buildingComponent.building.id == tavern.id
            ) {
                return {
                    left: [
                        {
                            text: "Enter",
                            icon: sprites2.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.clear();
                                stateContext.commandDispatcher(
                                    LoadSpaceCommand(selection.entity),
                                );
                                //add entity should add children also
                                //send back the space
                                //move overworld to entity under root, set as scope
                                //remove or add any space
                                //only render scope
                                //click on door, get option to leave
                                //leave should be part of root state? (root state has a state label with X)
                            },
                        },
                    ],
                    right: [],
                };
            } else {
                return emptySelection;
            }
        }

        return emptySelection;
    }
}
