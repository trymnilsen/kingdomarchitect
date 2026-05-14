import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { QueueJobCommand } from "../../../../../../server/message/command/queueJobCommand.ts";
import { ItemTag } from "../../../../../../data/inventory/inventoryItem.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../../../component/collectableComponent.ts";
import { GroundItemComponentId } from "../../../../../component/groundItemComponent.ts";
import { CollectItemJob } from "../../../../../job/collectItemJob.ts";
import { EquipUnitSelectionState } from "../../../equip/equipUnitSelectionState.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import { UIActionbarItem } from "../../../../view/uiActionbar.ts";
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

        const buttons: UIActionbarItem[] = [
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
        ];

        // Ground piles holding equippable items also expose an Equip
        // button that opens slot picker → unit picker.
        const isGroundPile = selection.entity.hasComponent(
            GroundItemComponentId,
        );
        if (isGroundPile) {
            const equipStack = collectable.items.find(
                (stack) => stack.item.tag?.includes(ItemTag.SkillGear),
            );
            if (equipStack) {
                const sourceId = selection.entity.id;
                const itemId = equipStack.item.id;
                buttons.push({
                    text: "Equip",
                    icon: spriteRefs.empty_sprite,
                    children: [
                        {
                            text: "Primary",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.push(
                                    new EquipUnitSelectionState(
                                        sourceId,
                                        itemId,
                                        "primary",
                                    ),
                                );
                            },
                        },
                        {
                            text: "Secondary",
                            icon: spriteRefs.empty_sprite,
                            onClick: () => {
                                stateContext.stateChanger.push(
                                    new EquipUnitSelectionState(
                                        sourceId,
                                        itemId,
                                        "secondary",
                                    ),
                                );
                            },
                        },
                    ],
                });
            }
        }

        return { left: buttons, right: [] };
    }
}
