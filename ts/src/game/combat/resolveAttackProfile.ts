import {
    getAttackProfileDefinition,
    unarmedAttackProfile,
    type AttackProfileDefinition,
} from "../../data/combat/attackProfileDefinition.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import type { Entity } from "../entity/entity.ts";

export function resolveAttackProfile(entity: Entity): AttackProfileDefinition {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (equipment) {
        for (const item of [
            equipment.slots.primary,
            equipment.slots.secondary,
        ]) {
            if (!item?.attack) {
                continue;
            }
            const definition = getAttackProfileDefinition(item.attack);
            if (definition) {
                return definition;
            }
        }
    }

    return unarmedAttackProfile;
}
