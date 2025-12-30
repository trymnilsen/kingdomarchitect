import { sprites2 } from "../../../../../../asset/sprite.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import {
    EquipmentComponentId,
    type EquipmentComponent,
} from "../../../../../component/equipmentComponent.ts";
import { InventoryComponentId } from "../../../../../component/inventoryComponent.ts";
import { PlayerUnitComponentId } from "../../../../../component/playerUnitComponent.ts";
import { Entity } from "../../../../../entity/entity.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import { UIActionbarItem } from "../../../../view/uiActionbar.ts";
import { AlertMessageState } from "../../../common/alertMessageState.ts";
import { InventoryState } from "../../../root/inventory/inventoryState.ts";
import { ActorContextActionState } from "../actorContextActionState.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { EquipItemCommand } from "../../../../../../server/message/command/equipItemCommand.ts";
import { AttackSelectionState } from "../../../attack/attackSelectionState.ts";
import { ItemTag } from "../../../../../../data/inventory/inventoryItem.ts";
import { ConsumeItemCommand } from "../../../../../../server/message/command/consumeItemCommand.ts";

export class WorkerSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const selectedEntity = selection.entity;
            const equipmentComponent =
                selectedEntity.getEcsComponent(EquipmentComponentId);
            const playerUnit = selectedEntity.getEcsComponent(
                PlayerUnitComponentId,
            );

            if (!!playerUnit && !!equipmentComponent) {
                return {
                    left: this.getPrimaryActions(stateContext, selectedEntity),
                    right: this.getEquipmentActions(
                        stateContext,
                        selectedEntity,
                        equipmentComponent,
                    ),
                };
            } else {
                return emptySelection;
            }
        } else {
            return emptySelection;
        }
        return emptySelection;
    }

    private getEquipmentActions(
        stateContext: StateContext,
        selectedEntity: Entity,
        equipmentComponent: EquipmentComponent,
    ): UIActionbarItem[] {
        const items: UIActionbarItem[] = [];
        this.addMainEquipmentActions(
            equipmentComponent,
            items,
            stateContext,
            selectedEntity,
        );

        this.addOtherEquipmentActions(
            equipmentComponent,
            items,
            stateContext,
            selectedEntity,
        );

        return items;
    }

    private addOtherEquipmentActions(
        equipmentComponent: EquipmentComponent,
        items: UIActionbarItem[],
        stateContext: StateContext,
        selectedEntity: Entity,
    ) {
        const otherItem = equipmentComponent.slots.other;

        if (otherItem) {
            const isConsumable = otherItem.tag?.includes(ItemTag.Consumable);
            const children: UIActionbarItem[] = [
                {
                    text: "Unequip",
                    onClick: () => {
                        stateContext.commandDispatcher(
                            EquipItemCommand(null, selectedEntity, "other"),
                        );
                    },
                    icon: sprites2.empty_sprite,
                },
            ];

            if (isConsumable) {
                children.push({
                    text: "Consume",
                    onClick: () => {
                        stateContext.commandDispatcher(
                            ConsumeItemCommand("other", selectedEntity),
                        );
                    },
                    icon: sprites2.empty_sprite,
                });
            }

            items.push({
                text: "Other",
                icon: otherItem.asset,
                children,
            });
        } else {
            items.push({
                text: "Other",
                icon: sprites2.empty_sprite,
                children: [
                    {
                        text: "Equip",
                        onClick: () => {
                            stateContext.stateChanger.push(
                                new InventoryState(selectedEntity),
                            );
                        },
                        icon: sprites2.empty_sprite,
                    },
                ],
            });
        }
    }

    addMainEquipmentActions(
        equipmentComponent: EquipmentComponent,
        items: UIActionbarItem[],
        stateContext: StateContext,
        selectedEntity: Entity,
    ) {
        const mainItem = equipmentComponent.slots.main;
        if (!!mainItem) {
            const isConsumable = mainItem.tag?.includes(ItemTag.Consumable);
            const children: UIActionbarItem[] = [
                {
                    text: "Unequip",
                    onClick: () => {
                        stateContext.commandDispatcher(
                            EquipItemCommand(null, selectedEntity, "main"),
                        );
                    },
                    icon: sprites2.empty_sprite,
                },
            ];

            if (isConsumable) {
                children.push({
                    text: "Consume",
                    onClick: () => {
                        stateContext.commandDispatcher(
                            ConsumeItemCommand("main", selectedEntity),
                        );
                    },
                    icon: sprites2.empty_sprite,
                });
            } else {
                children.push({
                    text: "Attack",
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new AttackSelectionState(selectedEntity),
                        );
                    },
                    icon: sprites2.empty_sprite,
                });
            }

            items.push({
                text: "Main",
                icon: mainItem.asset,
                children,
            });
        } else {
            const mainIcon = sprites2.empty_sprite;
            items.push({
                text: "Main",
                icon: mainIcon,
                children: [
                    {
                        text: "Equip",
                        onClick: () => {
                            stateContext.stateChanger.push(
                                new InventoryState(selectedEntity),
                            );
                        },
                        icon: sprites2.empty_sprite,
                    },
                ],
            });
        }
    }

    private getPrimaryActions(
        stateContext: StateContext,
        selectedEntity: Entity,
    ): UIActionbarItem[] {
        const items: UIActionbarItem[] = [
            {
                text: "Interact",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new ActorContextActionState(selectedEntity),
                    );
                },
            },
            {
                text: "Ledger",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    stateContext.stateChanger.push(
                        new InventoryState(selectedEntity),
                    );
                },
            },
            {
                text: "Mode",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new AlertMessageState("Skills", "no skills"),
                    );
                },
            },
        ];

        return items;
    }
}
