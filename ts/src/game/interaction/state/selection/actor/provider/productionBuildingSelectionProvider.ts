import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { ProductionComponentId } from "../../../../../component/productionComponent.ts";
import { JobQueueComponentId } from "../../../../../component/jobQueueComponent.ts";
import { sprites2 } from "../../../../../../asset/sprite.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";
import {
    createProductionJob,
    getProductionJobCountForBuilding,
    clearProductionJobsForBuilding,
} from "../../../../../job/productionJob.ts";
import { getProductionDefinition } from "../../../../../../data/production/productionDefinition.ts";
import type { UIActionbarItem } from "../../../../view/uiActionbar.ts";

export class ProductionBuildingSelectionProvider
    implements ActorSelectionProvider
{
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const buildingComponent =
                selection.entity.getEcsComponent(BuildingComponentId);
            const productionComponent = selection.entity.getEcsComponent(
                ProductionComponentId,
            );

            if (buildingComponent && productionComponent) {
                const definition = getProductionDefinition(
                    productionComponent.productionId,
                );
                if (!definition) {
                    return emptySelection;
                }

                const root = stateContext.root;
                const jobQueue = root.getEcsComponent(JobQueueComponentId);
                const queuedCount = jobQueue
                    ? getProductionJobCountForBuilding(
                          jobQueue,
                          selection.entity.id,
                      )
                    : 0;

                const actionText =
                    queuedCount > 0
                        ? `${definition.actionName} (${queuedCount})`
                        : definition.actionName;

                const leftButtons: UIActionbarItem[] = [
                    {
                        text: actionText,
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            const job = createProductionJob(
                                selection.entity.id,
                            );
                            stateContext.commandDispatcher(
                                QueueJobCommand(job),
                            );
                        },
                    },
                ];

                if (queuedCount > 0) {
                    leftButtons.push({
                        text: "Clear Queue",
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            const jq = root.getEcsComponent(JobQueueComponentId);
                            if (jq) {
                                clearProductionJobsForBuilding(
                                    jq,
                                    selection.entity.id,
                                );
                                root.invalidateComponent(JobQueueComponentId);
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

        return emptySelection;
    }
}
