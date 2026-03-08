import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { StockpileComponentId } from "../../../../../component/stockpileComponent.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import type { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import type { StateContext } from "../../../../handler/stateContext.ts";
import type { ButtonCollection } from "../../../../view/buttonCollection.ts";
import type { ActorSelectionProvider } from "./actorSelectionProvider.ts";
import { emptySelection } from "./actorSelectionProvider.ts";
import { StockpileState } from "../../../stockpile/stockpileState.ts";

export class BuildingSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const entity = selection.entity;

            if (entity.getEcsComponent(StockpileComponentId)) {
                return {
                    left: [
                        {
                            text: "Ledger",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.push(
                                    new StockpileState(entity, 0),
                                );
                            },
                        },
                        {
                            text: "Preferred",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.push(
                                    new StockpileState(entity, 1),
                                );
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
