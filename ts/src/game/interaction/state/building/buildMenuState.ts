import { UIAction } from "../../../../ui/uiView";
import { InteractionState } from "../../handler/interactionState";
import { buildMenuStateView } from "./buildMenuStateView";
import { SelectedBuildingUiActionType } from "./selectedBuildingUiAction";

export class BuildMenuState extends InteractionState {
    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        const view = buildMenuStateView();
        view.uiAction.listen(this.buildSelected);
        this.view = view;
    }

    private buildSelected = (uiAction: UIAction) => {
        if (uiAction.type == SelectedBuildingUiActionType) {
            this.context.stateChanger.pop(uiAction);
        }
    };
}
