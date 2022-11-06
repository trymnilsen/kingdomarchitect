import { UIAction } from "../../../../ui/uiView";

export type PossibleSelectedBuilding = "woodenHouse" | "walls";

export function selectedBuildingUiAction(
    build: PossibleSelectedBuilding
): SelectedBuildingUiAction {
    return {
        type: "SELECTED_BUILD_ITEM",
        data: {
            build: build,
        },
    };
}

export interface SelectedBuildingUiAction extends UIAction {
    type: typeof SelectedBuildingUiActionType;
    data: {
        build: PossibleSelectedBuilding;
    };
}

export const SelectedBuildingUiActionType = "SELECTED_BUILD_ITEM";
