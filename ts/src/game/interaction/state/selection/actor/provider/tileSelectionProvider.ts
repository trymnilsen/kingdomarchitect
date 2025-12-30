import { sprites2 } from "../../../../../../asset/sprite.ts";
import { SelectedTileItem } from "../../../../selection/selectedTileItem.ts";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import { BuildingState } from "../../../root/building/buildingState.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";

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
