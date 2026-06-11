import { itemEffectFactoryList } from "../../../data/inventory/itemEffectFactoryList.ts";
import { addEffectToEntity } from "../../component/activeEffectsComponent.ts";
import {
    HeldItemComponentId,
    isHeldEmpty,
} from "../../component/heldItemComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { ActionComplete, type ActionResult } from "./Action.ts";

export type DrinkFromHeldActionData = {
    type: "drinkFromHeld";
};

export function executeDrinkFromHeldAction(
    _action: DrinkFromHeldActionData,
    entity: Entity,
): ActionResult {
    const held = entity.getEcsComponent(HeldItemComponentId);
    if (!held || isHeldEmpty(held)) {
        return { kind: "failed", cause: { type: "noResources" } };
    }
    const item = held.item!;
    const effectFactory = itemEffectFactoryList[item.id];
    if (!effectFactory) {
        return { kind: "failed", cause: { type: "noResources" } };
    }

    held.amount -= 1;
    if (held.amount <= 0) {
        held.item = null;
        held.amount = 0;
    }
    entity.invalidateComponent(HeldItemComponentId);

    addEffectToEntity(entity, effectFactory(item), entity.id);

    return ActionComplete;
}
