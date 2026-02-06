import { spriteRefs } from "../../../../../../asset/sprite.ts";
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
import { RoleSelectionState } from "../../../role/roleSelectionState.ts";
import {
    RoleComponentId,
    WorkerStance,
} from "../../../../../component/worker/roleComponent.ts";
import { UpdateWorkerStanceCommand } from "../../../../../../server/message/command/updateWorkerStanceCommand.ts";

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
                    icon: spriteRefs.empty_sprite,
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
                    icon: spriteRefs.empty_sprite,
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
                icon: spriteRefs.empty_sprite,
                children: [
                    {
                        text: "Equip",
                        onClick: () => {
                            stateContext.stateChanger.push(
                                new InventoryState(selectedEntity),
                            );
                        },
                        icon: spriteRefs.empty_sprite,
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
                    icon: spriteRefs.empty_sprite,
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
                    icon: spriteRefs.empty_sprite,
                });
            } else {
                children.push({
                    text: "Attack",
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new AttackSelectionState(selectedEntity),
                        );
                    },
                    icon: spriteRefs.empty_sprite,
                });
            }

            items.push({
                text: "Main",
                icon: mainItem.asset,
                children,
            });
        } else {
            const mainIcon = spriteRefs.empty_sprite;
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
                        icon: spriteRefs.empty_sprite,
                    },
                ],
            });
        }
    }

    private getPrimaryActions(
        stateContext: StateContext,
        selectedEntity: Entity,
    ): UIActionbarItem[] {
        const roleComponent = selectedEntity.getEcsComponent(RoleComponentId);
        const currentStance = roleComponent?.stance ?? WorkerStance.Defensive;

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
                icon: spriteRefs.empty_sprite,
                onClick: () => {
                    stateContext.stateChanger.push(
                        new InventoryState(selectedEntity),
                    );
                },
            },
            {
                text: "Role",
                icon: spriteRefs.empty_sprite,
                onClick: () => {
                    stateContext.stateChanger.push(
                        new RoleSelectionState(selectedEntity),
                    );
                },
            },
            {
                text: "Stance",
                icon: spriteRefs.empty_sprite,
                children: [
                    {
                        text: "Aggressive",
                        icon: spriteRefs.empty_sprite,
                        onClick: () => {
                            stateContext.commandDispatcher(
                                UpdateWorkerStanceCommand(
                                    selectedEntity,
                                    WorkerStance.Aggressive,
                                ),
                            );
                        },
                    },
                    {
                        text: "Defensive",
                        icon: spriteRefs.empty_sprite,
                        onClick: () => {
                            stateContext.commandDispatcher(
                                UpdateWorkerStanceCommand(
                                    selectedEntity,
                                    WorkerStance.Defensive,
                                ),
                            );
                        },
                    },
                ],
            },
        ];

        return items;
    }
}
