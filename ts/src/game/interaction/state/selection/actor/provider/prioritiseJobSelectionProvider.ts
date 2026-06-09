import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { JobQueueComponentId } from "../../../../../component/jobQueueComponent.ts";
import { findPlayerKingdom } from "../../../../../component/playerKingdomComponent.ts";
import { isTargetOfJob } from "../../../../../job/job.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { PrioritiseJobCommand } from "../../../../../../server/message/command/prioritiseJobCommand.ts";

/**
 * Adds a "Prioritise job" button to any entity that is the target of a queued
 * job in the player's job queue (a building waiting to be built, a resource to
 * be chopped/mined, etc.). Pressing it asks the server to bump that entity's
 * first matching job to the front of the queue so it is worked next.
 *
 * The button is hidden when the targeting job is already at the front of the
 * queue, since there is nothing left to prioritise.
 */
export class PrioritiseJobSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        const entity = selection.entity;

        // Jobs live on the player kingdom's queue, not on the targeted entity's
        // ancestor chain (resources sit on world chunks, not under the kingdom),
        // so look the queue up from the root. Only the player's own queue is
        // searched, so goblin/enemy work is never offered here.
        const playerKingdom = findPlayerKingdom(entity.getRootEntity());
        const jobQueue = playerKingdom?.getEcsComponent(JobQueueComponentId);
        if (!jobQueue) {
            return emptySelection;
        }

        // Show the button only when a queued job targets this entity and it is
        // not already at the front (index 0). index -1 (no job) and index 0
        // (already next up) both leave nothing to prioritise.
        const index = jobQueue.jobs.findIndex((job) =>
            isTargetOfJob(job, entity),
        );
        if (index <= 0) {
            return emptySelection;
        }

        return {
            left: [
                {
                    text: "Prioritise job",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            PrioritiseJobCommand(entity.id),
                        );
                    },
                },
            ],
            right: [],
        };
    }
}
