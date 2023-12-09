import { Entity } from "../../../../../entity/entity.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";

export type ButtonSelection = {
    left: ReadonlyArray<UIActionbarItem>;
    right: ReadonlyArray<UIActionbarItem>;
};

export interface ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selectedEntity: Entity,
    ): ButtonSelection;
}

export const emptySelection: ButtonSelection = {
    left: [],
    right: [],
};
