import { withinRectangle } from "../../../../common/bounds";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { UIAction, UIView } from "../../../../ui/uiView";
import { GroundTile } from "../../../entity/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { buildMenuStateView } from "./buildMenuStateView";
import { SelectedBuildingUiActionType } from "./selectedBuildingUiAction";

export class BuildMenuState extends InteractionState {
    get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        this.view = buildMenuStateView();
        this.view.uiAction.listen(this.buildSelected);
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    private buildSelected = (uiAction: UIAction) => {
        if (uiAction.type == SelectedBuildingUiActionType) {
            this.context.stateChanger.pop(true);
        }
    };
}
