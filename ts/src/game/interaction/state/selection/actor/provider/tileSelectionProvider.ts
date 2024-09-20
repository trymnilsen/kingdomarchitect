import { sprites2 } from "../../../../../../asset/sprite.js";
import { SelectedTileItem } from "../../../../../selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { BuildingState } from "../../../root/building/buildingState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class TileSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedTileItem) {
            const selectedTile = selection.groundTile;
            return {
                left: [
                    {
                        text: "Build",
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            stateContext.stateChanger.replace(
                                new BuildingState(selection.tilePosition),
                            );
                        },
                    },
                ],
                right: [],
            };
        } else {
            return emptySelection;
        }
    }
}
