import { AttackJob } from "../../../../../componentOld/actor/mob/attackJob.js";
import { WorkerBehaviorComponent } from "../../../../../componentOld/behavior/workerBehaviorComponent.js";
import { BuildingComponent } from "../../../../../componentOld/building/buildingComponent.js";
import { HealthComponent } from "../../../../../componentOld/health/healthComponent.js";
import { JobQueueComponent } from "../../../../../componentOld/job/jobQueueComponent.js";
import { SelectedEntityItem } from "../../../../../../module/selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../../module/selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class AttackSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const healthComponent =
                selection.entity.getComponent(HealthComponent);

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

                                jobQueue.addJob(
                                    new AttackJob(selection.entity, 5),
                                );

                                stateContext.stateChanger.clear();
                            },
                        },
                    ],
                    right: [],
                };
            }
        }

        return emptySelection;
    }
}
