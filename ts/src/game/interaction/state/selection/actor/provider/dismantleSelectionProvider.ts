import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { PlayerKingdomComponentId } from "../../../../../component/playerKingdomComponent.ts";
import { getSettlementEntity } from "../../../../../entity/settlementQueries.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { DismantleBuildingCommand } from "../../../../../../server/message/command/dismantleBuildingCommand.ts";
import { ConfirmMessageState } from "../../../common/confirmMessageState.ts";

/**
 * Adds a button to every building that lets the player remove it. Labelled
 * "Cancel" while under construction (scaffolded) and "Dismantle" once built.
 * Both dispatch the same command — the server decides from live state.
 */
export class DismantleSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        const buildingComponent =
            selection.entity.getEcsComponent(BuildingComponentId);
        if (!buildingComponent) {
            return emptySelection;
        }

        // Only offer dismantling for player-owned buildings, never goblin/enemy ones.
        const settlement = getSettlementEntity(selection.entity);
        if (!settlement.hasComponent(PlayerKingdomComponentId)) {
            return emptySelection;
        }

        const text = buildingComponent.scaffolded ? "Cancel" : "Dismantle";
        const dispatchDismantle = () => {
            stateContext.commandDispatcher(
                DismantleBuildingCommand(selection.entity.id),
            );
        };

        return {
            left: [],
            right: [
                {
                    text,
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        // Cancelling a scaffolded building is low-stakes,
                        // only confirm dismantling a completed one.
                        if (buildingComponent.scaffolded) {
                            dispatchDismantle();
                            return;
                        }

                        stateContext.stateChanger.push(
                            new ConfirmMessageState(
                                "Dismantle",
                                "Dismantle this building?",
                            ),
                            (result) => {
                                if (result === true) {
                                    dispatchDismantle();
                                }
                            },
                        );
                    },
                },
            ],
        };
    }
}
