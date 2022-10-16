import { withinRectangle } from "../../../../common/bounds";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { UIView } from "../../../../ui/uiView";
import { GroundTile } from "../../../entity/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { buildMenuStateView } from "./buildMenuStateView";

export class BuildMenuState extends InteractionState {
    get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        this.view = buildMenuStateView();
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }
}
