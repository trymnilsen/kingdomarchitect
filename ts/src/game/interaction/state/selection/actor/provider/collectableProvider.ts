import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../../../component/collectableComponent.ts";
import { CollectItemJob } from "../../../../../job/collectItemJob.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";

export class CollectableProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (!(selection instanceof SelectedEntityItem)) return emptySelection;

        const collectable = selection.entity.getEcsComponent(
            CollectableComponentId,
        );
        if (!collectable || !hasCollectableItems(collectable)) {
            return emptySelection;
        }

        return {
            left: [
                {
                    text: "Collect",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            QueueJobCommand(CollectItemJob(selection.entity)),
                        );
                        stateContext.stateChanger.clear();
                    },
                },
            ],
            right: [],
        };
    }
}
