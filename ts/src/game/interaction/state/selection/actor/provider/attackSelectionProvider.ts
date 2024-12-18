import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { SelectedEntityItem } from "../../item/selectedEntityItem.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class AttackSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        _stateContext: StateContext,
        _selection: SelectedEntityItem,
    ): ButtonCollection {
        return emptySelection;
        /*
        const healthComponent = selection.entity.getComponent(HealthComponent);

        if (!!healthComponent) {
            if (!!selection.entity.getComponent(BuildingComponent)) {
                return emptySelection;
            }

            if (!!selection.entity.getComponent(WorkerBehaviorComponent)) {
                return emptySelection;
            }

            return {
                left: [
                    {
                        text: "Attack",
                        onClick: () => {
                            const jobQueue =
                                stateContext.root.requireComponent(
                                    JobQueueComponent,
                                );

                            jobQueue.addJob(new AttackJob(selection.entity, 5));

                            stateContext.stateChanger.clear();
                        },
                    },
                ],
                right: [],
            };
        }*/
    }
}
