import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";

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
