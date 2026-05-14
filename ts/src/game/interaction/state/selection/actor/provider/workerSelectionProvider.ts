import { spriteRefs } from "../../../../../../asset/sprite.ts";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.ts";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.ts";
import {
    EquipmentComponentId,
    type EquipmentComponent,
} from "../../../../../component/equipmentComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
    type HeldItemComponent,
} from "../../../../../component/heldItemComponent.ts";
import { PlayerUnitComponentId } from "../../../../../component/playerUnitComponent.ts";
import { Entity } from "../../../../../entity/entity.ts";
import { StateContext } from "../../../../handler/stateContext.ts";
import { ButtonCollection } from "../../../../view/buttonCollection.ts";
import { UIActionbarItem } from "../../../../view/uiActionbar.ts";
import { ActorContextActionState } from "../actorContextActionState.ts";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.ts";
import { UnequipItemCommand } from "../../../../../../server/message/command/unequipItemCommand.ts";
import { DropHeldCommand } from "../../../../../../server/message/command/dropHeldCommand.ts";
import { EquipFromHeldCommand } from "../../../../../../server/message/command/equipFromHeldCommand.ts";
import { AttackSelectionState } from "../../../attack/attackSelectionState.ts";
import { ItemTag } from "../../../../../../data/inventory/inventoryItem.ts";
import { ConsumeItemCommand } from "../../../../../../server/message/command/consumeItemCommand.ts";
import { RoleSelectionState } from "../../../role/roleSelectionState.ts";
import {
    RoleComponentId,
    WorkerStance,
} from "../../../../../component/worker/roleComponent.ts";
import { UpdateWorkerStanceCommand } from "../../../../../../server/message/command/updateWorkerStanceCommand.ts";
import { StatsViewState } from "../../../stats/statsViewState.ts";

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

            const heldComponent = selectedEntity.getEcsComponent(
                HeldItemComponentId,
            );

            if (!!playerUnit && !!equipmentComponent) {
                return {
                    left: this.getPrimaryActions(stateContext, selectedEntity),
                    right: this.getEquipmentActions(
                        stateContext,
                        selectedEntity,
                        equipmentComponent,
                        heldComponent,
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
        heldComponent: HeldItemComponent | null,
    ): UIActionbarItem[] {
        const items: UIActionbarItem[] = [];
        this.addPrimaryEquipmentActions(
            equipmentComponent,
            items,
            stateContext,
            selectedEntity,
        );

        this.addSecondaryEquipmentActions(
            equipmentComponent,
            items,
            stateContext,
            selectedEntity,
        );

        if (heldComponent) {
            this.addHeldActions(
                heldComponent,
                items,
                stateContext,
                selectedEntity,
            );
        }

        return items;
    }

    private addHeldActions(
        heldComponent: HeldItemComponent,
        items: UIActionbarItem[],
        stateContext: StateContext,
        selectedEntity: Entity,
    ) {
        if (isHeldEmpty(heldComponent)) {
            items.push({
                text: "Held",
                icon: spriteRefs.empty_sprite,
            });
            return;
        }

        const item = heldComponent.item!;
        const label = heldComponent.amount > 1
            ? `${item.name} ×${heldComponent.amount}`
            : item.name;

        items.push({
            text: label,
            icon: item.asset,
            children: [
                {
                    text: "Drop",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            DropHeldCommand(selectedEntity),
                        );
                    },
                },
                {
                    text: "Equip → Primary",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            EquipFromHeldCommand(selectedEntity, "primary"),
                        );
                    },
                },
                {
                    text: "Equip → Secondary",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        stateContext.commandDispatcher(
                            EquipFromHeldCommand(selectedEntity, "secondary"),
                        );
                    },
                },
            ],
        });
    }

    private addSecondaryEquipmentActions(
        equipmentComponent: EquipmentComponent,
        items: UIActionbarItem[],
        stateContext: StateContext,
        selectedEntity: Entity,
    ) {
        const secondaryItem = equipmentComponent.slots.secondary;

        if (secondaryItem) {
            const isConsumable = secondaryItem.tag?.includes(ItemTag.Consumable);
            const children: UIActionbarItem[] = [
                {
                    text: "Unequip",
                    onClick: () => {
                        stateContext.commandDispatcher(
                            UnequipItemCommand(selectedEntity, "secondary"),
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
                            ConsumeItemCommand("secondary", selectedEntity),
                        );
                    },
                    icon: spriteRefs.empty_sprite,
                });
            }

            items.push({
                text: "Secondary",
                icon: secondaryItem.asset,
                children,
            });
        } else {
            items.push({
                text: "Secondary",
                icon: spriteRefs.empty_sprite,
            });
        }
    }

    addPrimaryEquipmentActions(
        equipmentComponent: EquipmentComponent,
        items: UIActionbarItem[],
        stateContext: StateContext,
        selectedEntity: Entity,
    ) {
        const primaryItem = equipmentComponent.slots.primary;
        if (!!primaryItem) {
            const isConsumable = primaryItem.tag?.includes(ItemTag.Consumable);
            const children: UIActionbarItem[] = [
                {
                    text: "Unequip",
                    onClick: () => {
                        stateContext.commandDispatcher(
                            UnequipItemCommand(selectedEntity, "primary"),
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
                            ConsumeItemCommand("primary", selectedEntity),
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
                text: "Primary",
                icon: primaryItem.asset,
                children,
            });
        } else {
            items.push({
                text: "Primary",
                icon: spriteRefs.empty_sprite,
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
                text: "Role",
                icon: spriteRefs.empty_sprite,
                onClick: () => {
                    stateContext.stateChanger.push(
                        new RoleSelectionState(selectedEntity),
                    );
                },
            },
            {
                text: "Stats",
                icon: spriteRefs.empty_sprite,
                onClick: () => {
                    stateContext.stateChanger.push(
                        new StatsViewState(selectedEntity),
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
