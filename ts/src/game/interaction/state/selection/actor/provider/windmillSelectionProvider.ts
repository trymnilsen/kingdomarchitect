import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { JobQueueComponentId } from "../../../../../component/jobQueueComponent.ts";
import { getSettlementEntity } from "../../../../../entity/settlementQueries.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";
import {
    createWindmillJob,
    getWindmillJobCountForBuilding,
    clearWindmillJobsForBuilding,
} from "../../../../../job/windmillJob.ts";
import { windmill } from "../../../../../../data/building/food/windmill.ts";
import type { UIActionbarItem } from "../../../../view/uiActionbar.ts";

export class WindmillSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        const buildingComponent =
            selection.entity.getEcsComponent(BuildingComponentId);
        if (
            !buildingComponent ||
            buildingComponent.building.id !== windmill.id ||
            buildingComponent.scaffolded
        ) {
            return emptySelection;
        }

        const settlement = getSettlementEntity(selection.entity);
        const jobQueue = settlement.getEcsComponent(JobQueueComponentId);
        const queuedCount = jobQueue
            ? getWindmillJobCountForBuilding(jobQueue, selection.entity.id)
            : 0;

        const actionText =
            queuedCount > 0 ? `Farm (${queuedCount})` : "Farm";

        const leftButtons: UIActionbarItem[] = [
            {
                text: actionText,
                icon: spriteRefs.empty_sprite,
                onClick: () => {
                    const job = createWindmillJob(selection.entity.id);
                    stateContext.commandDispatcher(QueueJobCommand(job));
                },
            },
        ];

        if (queuedCount > 0) {
            leftButtons.push({
                text: "Clear Queue",
                icon: spriteRefs.empty_sprite,
                onClick: () => {
                    const jq =
                        settlement.getEcsComponent(JobQueueComponentId);
                    if (jq) {
                        clearWindmillJobsForBuilding(jq, selection.entity.id);
                        settlement.invalidateComponent(JobQueueComponentId);
                    }
                },
            });
        }

        return {
            left: leftButtons,
            right: [],
        };
    }
}
