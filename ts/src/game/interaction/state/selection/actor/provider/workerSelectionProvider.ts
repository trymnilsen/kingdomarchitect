import { sprites2 } from "../../../../../../asset/sprite.js";
import { SelectedEntityItem } from "../../../../selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../selection/selectedWorldItem.js";
import {
    EquipmentComponentId,
    type EquipmentComponent,
} from "../../../../../component/equipmentComponent.js";
import { InventoryComponentId } from "../../../../../component/inventoryComponent.js";
import { PlayerUnitComponentId } from "../../../../../component/playerUnitComponent.js";
import { Entity } from "../../../../../entity/entity.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/buttonCollection.js";
import { UIActionbarItem } from "../../../../view/uiActionbar.js";
import { AlertMessageState } from "../../../common/alertMessageState.js";
import { InventoryState } from "../../../root/inventory/inventoryState.js";
import { ActorMovementState } from "../actorMovementState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";
import { EquipItemCommand } from "../../../../../../server/message/command/equipItemCommand.js";

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

        items.push({
            text: "Other",
            icon: sprites2.empty_sprite,
            children: this.getEmptyOtherEquipmentAction(
                stateContext,
                selectedEntity,
                equipmentComponent,
            ),
        });
    }

    addMainEquipmentActions(
        equipmentComponent: EquipmentComponent,
        items: UIActionbarItem[],
        stateContext: StateContext,
        selectedEntity: Entity,
    ) {
        const mainItem = equipmentComponent.slots.main;
        if (!!mainItem) {
            items.push({
                text: "Main",
                icon: mainItem.asset,
                children: [
                    {
                        text: "Unequip",
                        onClick: () => {
                            stateContext.commandDispatcher(
                                EquipItemCommand(null, selectedEntity, "main"),
                            );
                        },
                        icon: sprites2.empty_sprite,
                    },
                ],
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
                        new ActorMovementState(selectedEntity),
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

    private getEmptyOtherEquipmentAction(
        stateContext: StateContext,
        selectedEntity: Entity,
        _equipmentComponent: EquipmentComponent,
    ): UIActionbarItem[] {
        return [
            {
                text: "Equip",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new InventoryState(selectedEntity),
                    );
                },
                icon: sprites2.empty_sprite,
            },
        ];
    }
}
