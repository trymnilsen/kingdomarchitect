import { Effect } from "../../../../../../data/effect/effect.js";
import { InventoryItem } from "../../../../../../data/inventory/inventoryItem.js";
import { itemEffectFactoryList } from "../../../../../../data/inventory/itemEffectFactoryList.js";
import { sprites2 } from "../../../../../../module/asset/sprite.js";
import { SelectedEntityItem } from "../../../../../../module/selection/selectedEntityItem.js";
import { SelectedWorldItem } from "../../../../../../module/selection/selectedWorldItem.js";
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
        const mainItem = equipmentComponent.offhandItem;

        items.push({
            text: "Main",
            icon: sprites2.empty_sprite,
            children: this.getEmptyMainEquipmentAction(
                stateContext,
                selectedEntity,
                equipmentComponent,
            ),
        });

        const otherItem = equipmentComponent.offhandItem;

        items.push({
            text: "Other",
            icon: sprites2.empty_sprite,
            children: this.getEmptyOtherEquipmentAction(
                stateContext,
                selectedEntity,
                equipmentComponent,
            ),
        });

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
                text: "Stash",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    const inventory =
                        selectedEntity.requireEcsComponent(
                            InventoryComponentId,
                        );

                    stateContext.stateChanger.push(
                        new InventoryState(inventory),
                    );
                },
            },
            {
                text: "Skills",
                onClick: () => {
                    stateContext.stateChanger.push(
                        new AlertMessageState("Not implement", "no skills"),
                    );
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
                        selectedEntity.requireEcsComponent(
                            InventoryComponentId,
                        );

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
                        selectedEntity.requireEcsComponent(
                            InventoryComponentId,
                        );

                    stateContext.stateChanger.push(
                        new InventoryState(inventory),
                    );
                },
                icon: sprites2.empty_sprite,
            },
        ];
    }
}
