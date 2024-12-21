import { Entity } from "../../../../../entity/entity.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";
import { SelectedEntityItem } from "../../item/selectedEntityItem.js";

export interface ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedEntityItem,
    ): ButtonCollection;
}

export const emptySelection: ButtonCollection = {
    left: [],
    right: [],
};
