import { sprites2 } from "../../../../../../module/asset/sprite.js";
import { TreeComponent } from "../../../../../componentOld/resource/treeComponent.js";
import { Entity } from "../../../../../entity/entity.js";
import { SelectedEntityItem } from "../../../../../../module/selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../../module/selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { ChopJobState } from "../../../resource/chopJopState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class TreeSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
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
        }
    }
}
