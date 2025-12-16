import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";
import { ResourceComponentId } from "../../../../../component/resourceComponent.js";
import { sprites2 } from "../../../../../../asset/sprite.js";
import { CollectResourceJob } from "../../../../../job/collectResourceJob.js";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.js";
import { queryForJobsWithTarget } from "../../../../../job/query.js";
import { ResourceCategory } from "../../../../../../data/inventory/items/naturalResource.js";
import type { Entity } from "../../../../../entity/entity.js";

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
                const jobsOnTree = queryForJobsWithTarget(selectedEntity);
                if (jobsOnTree.length > 0) {
                    return {
                        left: [
                            {
                                text: "Cancel Job",
                                icon: sprites2.empty_sprite,
                                onClick: () => {},
                            },
                        ],
                        right: [],
                    };
                } else {
                    return {
                        left: getButtonsBasedOnCategory(
                            resourceComponent.resource.category,
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
function getButtonsBasedOnCategory(
    category: ResourceCategory | ResourceCategory[],
    stateContext: StateContext,
    selectedEntity: Entity,
) {
    category = Array.isArray(category) ? category : [category];
    return category.map((category) => {
        return {
            text: getNameForCategory(category),
            icon: sprites2.empty_sprite,
            onClick: () => {
                const job = CollectResourceJob(selectedEntity);
                stateContext.commandDispatcher(QueueJobCommand(job));
                //stateContext.stateChanger.pop(null);
            },
        };
    });
}

function getNameForCategory(category: ResourceCategory): any {
    switch (category) {
        case ResourceCategory.Chop:
            return "Chop";
        case ResourceCategory.Cut:
            return "Cut";
        case ResourceCategory.Mine:
            return "Mine";
        case ResourceCategory.Pick:
            return "Pick";
    }
}
