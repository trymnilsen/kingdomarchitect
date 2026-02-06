import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { ResourceComponentId } from "../../../../../component/resourceComponent.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { CollectResourceJob } from "../../../../../job/collectResourceJob.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";
import { queryForJobsWithTarget } from "../../../../../job/query.ts";
import {
    getResourceById,
    ResourceHarvestMode,
} from "../../../../../../data/inventory/items/naturalResource.ts";
import type { Entity } from "../../../../../entity/entity.ts";

export class ResourceSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const selectedEntity = selection.entity;
            const resourceComponent =
                selectedEntity.getEcsComponent(ResourceComponentId);
            if (!!resourceComponent) {
                // Lookup resource definition
                const resource = getResourceById(resourceComponent.resourceId);
                if (!resource) {
                    console.error(
                        `No resource found for ID: ${resourceComponent.resourceId}`,
                    );
                    return emptySelection;
                }

                const jobsOnTree = queryForJobsWithTarget(selectedEntity);
                if (jobsOnTree.length > 0) {
                    return {
                        left: [
                            {
                                text: "Cancel Job",
                                icon: spriteRefs.empty_sprite,
                                onClick: () => {},
                            },
                        ],
                        right: [],
                    };
                } else {
                    return {
                        left: getButtonsBasedOnHarvestMode(
                            resource.harvestMode,
                            stateContext,
                            selectedEntity,
                        ),
                        right: [],
                    };
                }
            } else {
                return emptySelection;
            }
        } else {
            return emptySelection;
        }
    }
}
function getButtonsBasedOnHarvestMode(
    mode: ResourceHarvestMode | readonly ResourceHarvestMode[],
    stateContext: StateContext,
    selectedEntity: Entity,
) {
    mode = Array.isArray(mode) ? mode : [mode];
    return mode.map((harvestAction) => {
        return {
            text: getNameForHarvestMode(harvestAction),
            icon: spriteRefs.empty_sprite,
            onClick: () => {
                const job = CollectResourceJob(selectedEntity, harvestAction);
                stateContext.commandDispatcher(QueueJobCommand(job));
                //stateContext.stateChanger.pop(null);
            },
        };
    });
}

function getNameForHarvestMode(mode: ResourceHarvestMode): any {
    switch (mode) {
        case ResourceHarvestMode.Chop:
            return "Chop";
        case ResourceHarvestMode.Cut:
            return "Cut";
        case ResourceHarvestMode.Mine:
            return "Mine";
        case ResourceHarvestMode.Pick:
            return "Pick";
    }
}
