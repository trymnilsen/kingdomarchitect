import { sprites2 } from "../../../../../../asset/sprite.js";
import { TreeComponent } from "../../../../../component/resource/treeComponent.js";
import { Entity } from "../../../../../entity/entity.js";
import { SelectedEntityItem } from "../../item/selectedEntityItem.js";
import { SelectedWorldItem } from "../../item/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { ChopJobState } from "../../../resource/chopJopState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class TreeSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedEntityItem,
    ): ButtonCollection {
        return emptySelection;

        /*
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
    }
}
