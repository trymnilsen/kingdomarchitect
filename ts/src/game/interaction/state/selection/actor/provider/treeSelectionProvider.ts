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
import { ChopTreeJob } from "../../../../../job/chopTreeJob.js";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.js";
import { queryForJobsWithTarget } from "../../../../../job/query.js";

export class TreeSelectionProvider implements ActorSelectionProvider {
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
                        left: [
                            {
                                text: "Chop",
                                icon: sprites2.empty_sprite,
                                onClick: () => {
                                    const job = ChopTreeJob(selectedEntity);
                                    stateContext.commandDispatcher(
                                        QueueJobCommand(job),
                                    );
                                    //stateContext.stateChanger.pop(null);
                                },
                            },
                        ],
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
