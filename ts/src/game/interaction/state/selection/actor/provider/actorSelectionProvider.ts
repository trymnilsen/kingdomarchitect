import { Entity } from "../../../../../entity/entity.js";
import { SelectedWorldItem } from "../../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";

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
