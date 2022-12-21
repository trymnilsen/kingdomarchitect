import { InteractionState } from "../../handler/interactionState";
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
}
