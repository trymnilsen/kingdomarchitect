import { sprites2 } from "../../../../../../module/asset/sprite.js";
import { Effect } from "../../../../../../data/effect/effect.js";
import {
    InventoryItem,
    ItemTag,
} from "../../../../../../data/inventory/inventoryItem.js";
import { itemEffectFactoryList } from "../../../../../../data/inventory/itemEffectFactoryList.js";
import { WorkerBehaviorComponent } from "../../../../../component/behavior/workerBehaviorComponent.js";
import { SpriteComponent } from "../../../../../component/draw/spriteComponent.js";
import { EffectComponent } from "../../../../../component/effect/effectComponent.js";
import {
    EquipmentComponent,
    EquipmentSlot,
} from "../../../../../component/inventory/equipmentComponent.js";
import { InventoryComponent2 } from "../../../../../component/inventory/inventoryComponent.js";
import { Entity } from "../../../../../entity/entity.js";
import { SelectedEntityItem } from "../../../../../../module/selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../../module/selection/selectedWorldItem.js";
import { StateContext } from "../../../../handler/stateContext.js";
import { ButtonCollection } from "../../../../view/actionbar/buttonCollection.js";
import { UIActionbarItem } from "../../../../view/actionbar/uiActionbar.js";
import { CharacterSkillState } from "../../../character/characterSkillState.js";
import { AlertMessageState } from "../../../common/alertMessageState.js";
import { InventoryState } from "../../../root/inventory/inventoryState.js";
import { ActorMovementState } from "../actorMovementState.js";
import {
    ActorSelectionProvider,
    emptySelection,
} from "./actorSelectionProvider.js";

export class WorkerSelectionProvider implements ActorSelectionProvider {
    provideButtons(
        stateContext: StateContext,
        selection: SelectedWorldItem,
    ): ButtonCollection {
        if (selection instanceof SelectedEntityItem) {
            const selectedEntity = selection.entity;
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
                children: this.getOtherActions(
                    stateContext,
                    selectedEntity,
                    equipmentComponent.otherItem,
                ),
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

        items.push({
            text: "Job",
            icon: sprites2.empty_sprite,
            children: [
                {
                    text: "Abort",
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new AlertMessageState("Oh no", "Not implemented"),
                        );
                    },
                    icon: sprites2.empty_sprite,
                },
                {
                    text: "Unassign",
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new AlertMessageState("Oh no", "Not implemented"),
                        );
                    },
                    icon: sprites2.empty_sprite,
                },
                {
                    text: "Close",
                    onClick: () => {
                        stateContext.stateChanger.push(
                            new AlertMessageState("Oh no", "Not implemented"),
                        );
                    },
                    icon: sprites2.empty_sprite,
                },
            ],
        });

        return items;
    }

    private getOtherActions(
        _stateContext: StateContext,
        selectedEntity: Entity,
        otherItem: EquipmentSlot,
    ): UIActionbarItem[] {
        return [
            {
                text: "Unequip",
                onClick: () => {
                    otherItem.setItem(null);
                },
                icon: sprites2.empty_sprite,
            },
            {
                text: "Consume",
                onClick: () => {
                    const effectComponent =
                        selectedEntity.getComponent(EffectComponent);
                    const inventoryComponent =
                        selectedEntity.requireComponent(InventoryComponent2);

                    const item = otherItem.getItem();
                    let effect: Effect | null = null;
                    if (item) {
                        const factory = itemEffectFactoryList[item.id];
                        if (!!factory) {
                            effect = factory(item);
                        }
                    }

                    if (effectComponent && item && !!effect) {
                        otherItem.setItem(null);
                        inventoryComponent.removeInventoryItem(item.id, 1);
                        effectComponent.addEffect(effect);
                    }
                },
                icon: sprites2.empty_sprite,
            },
        ];
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
                text: "Stash",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    const inventory =
                        selectedEntity.requireComponent(InventoryComponent2);

                    stateContext.stateChanger.push(
                        new InventoryState(inventory),
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
        _equipmentComponent: EquipmentComponent,
    ): UIActionbarItem[] {
        return [
            {
                text: "Equip",
                onClick: () => {
                    const inventory =
                        selectedEntity.requireComponent(InventoryComponent2);

                    stateContext.stateChanger.push(
                        new InventoryState(inventory),
                    );
                },
                icon: sprites2.empty_sprite,
            },
        ];
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
                    const inventory =
                        selectedEntity.requireComponent(InventoryComponent2);

                    stateContext.stateChanger.push(
                        new InventoryState(inventory),
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
                        stateContext.root.requireComponent(InventoryComponent2);
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
