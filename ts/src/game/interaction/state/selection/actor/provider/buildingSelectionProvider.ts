import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { tavern } from "../../../../../../data/building/food/tavern.ts";
import { sprites2 } from "../../../../../../asset/sprite.ts";
import { LoadSpaceCommand } from "../../../../../../server/message/command/enterSpaceCommand.ts";

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
