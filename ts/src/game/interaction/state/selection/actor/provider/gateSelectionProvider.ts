import { type SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { type StateContext } from "../../../../handler/stateContext.ts";
import { type ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    type ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { BuildingComponentId } from "../../../../../component/buildingComponent.ts";
import { GateComponentId } from "../../../../../component/gateComponent.ts";
import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { SetGateOpenCommand } from "../../../../../../server/message/command/setGateOpenCommand.ts";

/**
 * Selecting a finished gate offers the one thing a gate does. The button says
 * what will happen rather than what the state is, so there is no reading a
 * label backwards in the dark.
 */
export class GateSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) {
            return emptySelection;
        }

        const buildingComponent =
            selection.entity.getEcsComponent(BuildingComponentId);
        if (!buildingComponent || buildingComponent.scaffolded) {
            return emptySelection;
        }

        const gate = selection.entity.getEcsComponent(GateComponentId);
        if (!gate) {
            return emptySelection;
        }

        return {
            left: [
                {
                    text: gate.isOpen ? "Close Gate" : "Open Gate",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            SetGateOpenCommand(selection.entity, !gate.isOpen),
                        );
                    },
                },
            ],
            right: [],
        };
    }
}
