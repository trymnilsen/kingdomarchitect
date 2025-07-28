import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class TreeSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedWorldItem,
    ): ButtonCollection {
        /*
        TODO: Reimplement selection of resources
        if (selection instanceof SelectedEntityItem) {
            const selectedEntity = selection.entity;
            const treeComponent = selectedEntity.getComponent(TreeComponent);
            if (!!treeComponent) {
                return {
                    left: [
                        {
                            text: "Chop",
                            icon: sprites2.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.replace(
                                    new ChopJobState(selectedEntity),
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
        return emptySelection;
    }
}
