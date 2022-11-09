import { InputEvent } from "../../../../input/input";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { getActionbarView } from "../../view/actionbar";

export class PathBuildState extends InteractionState {
    constructor() {
        super();
        this.view = getActionbarView(
            [
                {
                    name: "Confirm",
                    id: "single",
                },
                {
                    name: "Cancel",
                    id: "path",
                },
            ],
            (action) => {}
        );
    }
    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        throw new Error("Method not implemented.");
    }
}
