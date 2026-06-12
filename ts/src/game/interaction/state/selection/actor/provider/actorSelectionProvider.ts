import { type SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { type StateContext } from "../../../../handler/stateContext.ts";
import { type ButtonCollection } from "../../../../view/buttonCollection.ts";

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
