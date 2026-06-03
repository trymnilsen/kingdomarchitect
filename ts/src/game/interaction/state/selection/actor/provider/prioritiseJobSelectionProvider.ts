import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { PlayerKingdomComponentId } from "../../../../../component/playerKingdomComponent.ts";
import { getSettlementEntity } from "../../../../../entity/settlementQueries.ts";
import { getJobsTargetingEntity } from "../../../../../job/jobQuery.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { PrioritiseJobCommand } from "../../../../../../server/message/command/prioritiseJobCommand.ts";

/**
 * Adds a "Prioritise job" button to any player-owned entity that is the target
 * of a queued job (a building waiting to be built, a resource to be collected,
 * etc.). Pressing it asks the server to bump that entity's first matching job to
 * the front of the job queue so it is worked next.
 */
export class PrioritiseJobSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        // Only offer this for player-owned entities, never goblin/enemy ones.
        const settlement = getSettlementEntity(selection.entity);
        if (!settlement.hasComponent(PlayerKingdomComponentId)) {
            return emptySelection;
        }

        // Nothing to prioritise unless a queued job actually targets this entity.
        if (getJobsTargetingEntity(selection.entity).length === 0) {
            return emptySelection;
        }

        return {
            left: [
                {
                    text: "Prioritise job",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            PrioritiseJobCommand(selection.entity.id),
                        );
                    },
                },
            ],
            right: [],
        };
    }
}
