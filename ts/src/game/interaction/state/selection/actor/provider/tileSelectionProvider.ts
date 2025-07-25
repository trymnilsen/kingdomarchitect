import { sprites2 } from "../../../../../../module/asset/sprite.js";
import { SelectedTileItem } from "../../../../../../module/selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../../../../module/selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
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
