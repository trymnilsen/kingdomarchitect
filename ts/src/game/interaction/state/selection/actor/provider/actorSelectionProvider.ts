import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";

export interface ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection;
}

export const emptySelection: ButtonCollection = {
    left: [],
    right: [],
};
