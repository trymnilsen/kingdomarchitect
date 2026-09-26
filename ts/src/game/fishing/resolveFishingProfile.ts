import {
    getFishingProfileDefinition,
    type FishingProfileDefinition,
} from "../../data/fishing/fishingProfileDefinition.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import type { Entity } from "../entity/entity.ts";

// Null without tackle, since unlike attacking there is no bare-handed fallback
export function resolveFishingProfile(
    entity: Entity,
): FishingProfileDefinition | null {
    const equipment = entity.getEcsComponent(EquipmentComponentId);
    if (!equipment) {
        return null;
    }

    for (const item of [equipment.slots.primary, equipment.slots.secondary]) {
        if (!item?.fishing) {
            continue;
        }
        const definition = getFishingProfileDefinition(item.fishing);
        if (definition) {
            return definition;
        }
    }

    return null;
}
