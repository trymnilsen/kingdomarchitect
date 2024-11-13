import { HealthComponent } from "../../../../../component/health/healthComponent.js";
import { SelectedEntityItem } from "../../../../../selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class AttackSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const healthComponent =
                selection.entity.getComponent(HealthComponent);

            if (!!healthComponent) {
                return {
                    left: [
                        {
                            text: "Attack",
                            onClick: () => {},
                        },
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }
}
