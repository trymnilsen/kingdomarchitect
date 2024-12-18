import { entityOf } from "../../../../../../ecs/ecsComponent.js";
import { PlayerControllableActorComponent } from "../../../../../ecsComponent/actor/playerControllableActorComponent.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { SelectedEntityItem } from "../../item/selectedEntityItem.js";
import { ActorMovementState } from "../actorMovementState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class PlayerControllableCharacterSelectionProvider
    implements ActorSelectionProvider
{
    provideButtons(
        stateContext: StateContext,
        selection: SelectedEntityItem,
    ): ButtonCollection {
        const playerControllableComponent =
            stateContext.world.components.getComponent(
                entityOf(selection.transform),
                PlayerControllableActorComponent,
            );

        if (!playerControllableComponent) {
            return emptySelection;
        }

        return {
            left: [
                {
                    text: "Move",
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new ActorMovementState(selection.transform),
                        );
                    },
                },
            ],
            right: [],
        };
    }
}
