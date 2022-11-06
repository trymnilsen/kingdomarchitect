import { InputEvent } from "../../../../input/input";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { getActionbarView } from "../../view/actionbar";

export class PathOrSingleBuild extends InteractionState {
    constructor() {
        super();
        this.view = getActionbarView(
            [
                {
                    name: "Single",
                    id: "single",
                },
                {
                    name: "Path",
                    id: "path",
                },
            ],
            (action) => {}
        );
    }
    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }
}
