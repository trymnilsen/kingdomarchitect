import { sprites2 } from "../../../../../../asset/sprite.js";
import {
    InventoryItem,
    ItemTag,
} from "../../../../../../data/inventory/inventoryItem.js";
import { WorkerBehaviorComponent } from "../../../../../component/behavior/workerBehaviorComponent.js";
import { SpriteComponent } from "../../../../../component/draw/spriteComponent.js";
import { EquipmentComponent } from "../../../../../component/inventory/equipmentComponent.js";
import { InventoryComponent } from "../../../../../component/inventory/inventoryComponent.js";
import { Entity } from "../../../../../entity/entity.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";
import { CharacterSkillState } from "../../../character/characterSkillState.js";
import { EquipOnActorAction } from "../../../root/inventory/equipActions.js";
import { InventoryState } from "../../../root/inventory/inventoryState.js";
import { ActorMovementState } from "../actorMovementState.js";
import {
    ActorSelectionProvider,
    ButtonSelection,
    emptySelection,
} from "./actorSelectionProvider.js";

export class WorkerSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selectedEntity: Entity,
    ): ButtonSelection {
        const equipmentComponent =
            selectedEntity.getComponent(EquipmentComponent);
        const workerComponent = selectedEntity.getComponent(
            WorkerBehaviorComponent,
        );

        if (!!equipmentComponent && !!workerComponent) {
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
    }

    private getEquipmentActions(
        stateContext: StateContext,
        selectedEntity: Entity,
        equipmentComponent: EquipmentComponent,
    ): UIActionbarItem[] {
        const items: UIActionbarItem[] = [];
        const mainItem = equipmentComponent.mainItem.getItem();

        if (mainItem) {
            items.push({
                text: "Main",
                children: this.getEquipmentAction(
                    mainItem,
                    stateContext,
                    selectedEntity,
                ),
                icon: mainItem.asset,
            });
        } else {
            items.push({
                text: "Main",
                icon: sprites2.empty_sprite,
                children: this.getEmptyMainEquipmentAction(
                    stateContext,
                    selectedEntity,
                    equipmentComponent,
                ),
            });
        }

        const otherItem = equipmentComponent.otherItem.getItem();

        if (otherItem) {
            items.push({
                text: "Other",
                icon: otherItem.asset,
            });
        } else {
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

        return items;
    }

    private getPrimaryActions(
        stateContext: StateContext,
        selectedEntity: Entity,
    ): UIActionbarItem[] {
        const items: UIActionbarItem[] = [
            {
                text: "Move",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new ActorMovementState(selectedEntity),
                    );
                },
            },
            {
                text: "Skills",
                onClick: () => {
                    stateContext.stateChanger.push(new CharacterSkillState());
                },
            },
            {
                text: "Stats",
            },
            {
                text: "Close",
            },
        ];

        return items;
    }

    private getEmptyMainEquipmentAction(
        stateContext: StateContext,
        selectedEntity: Entity,
        equipmentComponent: EquipmentComponent,
    ): UIActionbarItem[] {
        return [
            {
                text: "Equip",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new InventoryState(
                            new EquipOnActorAction(
                                selectedEntity,
                                equipmentComponent.mainItem,
                            ),
                        ),
                    );
                },
                icon: sprites2.empty_sprite,
            },
        ];
    }

    private getEmptyOtherEquipmentAction(
        stateContext: StateContext,
        selectedEntity: Entity,
        equipmentComponent: EquipmentComponent,
    ): UIActionbarItem[] {
        return [
            {
                text: "Equip",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new InventoryState(
                            new EquipOnActorAction(
                                selectedEntity,
                                equipmentComponent.otherItem,
                            ),
                        ),
                    );
                },
                icon: sprites2.empty_sprite,
            },
        ];
    }

    private getEquipmentAction(
        _inventoryItem: InventoryItem,
        stateContext: StateContext,
        selectedEntity: Entity,
    ): UIActionbarItem[] | undefined {
        return [
            {
                text: "Unequip",
                onClick: () => {
                    const inventoryComponent =
                        stateContext.root.requireComponent(InventoryComponent);
                    const equipmentComponent =
                        selectedEntity.requireComponent(EquipmentComponent);

                    equipmentComponent.mainItem.setItem(null);
                },
                icon: sprites2.empty_sprite,
            },
            {
                text: "Attack",
                onClick: () => {
                    //this.onMainItemTap();
                },
                icon: sprites2.empty_sprite,
            },
            {
                text: "Defend",
                onClick: () => {
                    //this.onMainItemTap();
                },
                icon: sprites2.empty_sprite,
            },
        ];
    }
}
