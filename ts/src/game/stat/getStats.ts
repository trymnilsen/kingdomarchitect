import type { Entity } from "../entity/entity.ts";
import {
    StatsComponentId,
    type StatsComponent,
} from "../component/statsComponent.ts";
import {
    ActiveEffectsComponentId,
} from "../component/activeEffectsComponent.ts";
import { EquipmentComponentId } from "../component/equipmentComponent.ts";
import type {
    StatType,
    ResolvedStats,
    StatModifiers,
    StatContributor,
} from "./statType.ts";
import { statTypes } from "./statType.ts";

export function getStats(entity: Entity): ResolvedStats {
    const statsComponent = entity.getEcsComponent(
        StatsComponentId,
    ) as StatsComponent | null;

    if (!statsComponent) {
        return { might: 1, wit: 1, presence: 1, valor: 1 };
    }

    if (!statsComponent.dirty) {
        return statsComponent.cache;
    }

    const flatSums: Record<StatType, number> = {
        might: 0,
        wit: 0,
        presence: 0,
        valor: 0,
    };
    const percentProducts: Record<StatType, number> = {
        might: 1,
        wit: 1,
        presence: 1,
        valor: 1,
    };

    collectEquipmentModifiers(entity, flatSums, percentProducts);
    collectEffectModifiers(entity, flatSums, percentProducts);

    const resolved: ResolvedStats = { might: 1, wit: 1, presence: 1, valor: 1 };
    for (const stat of statTypes) {
        resolved[stat] = Math.max(
            1,
            Math.floor(
                (statsComponent.baseStats[stat] + flatSums[stat]) *
                    percentProducts[stat],
            ),
        );
    }

    statsComponent.cache = resolved;
    statsComponent.dirty = false;

    return resolved;
}

export function getStatBreakdown(
    entity: Entity,
    stat: StatType,
): StatContributor[] {
    const statsComponent = entity.getEcsComponent(
        StatsComponentId,
    ) as StatsComponent | null;

    if (!statsComponent) {
        return [];
    }

    const contributors: StatContributor[] = [
        { label: "Base", stat, flat: statsComponent.baseStats[stat] },
    ];

    const equipmentComponent = entity.getEcsComponent(EquipmentComponentId);
    if (equipmentComponent) {
        for (const item of Object.values(equipmentComponent.slots)) {
            if (item?.statModifiers) {
                const mod = item.statModifiers[stat];
                if (mod) {
                    contributors.push({
                        label: item.name,
                        stat,
                        flat: mod.flat,
                        percent: mod.percent,
                    });
                }
            }
        }
    }

    const effectsComponent = entity.getEcsComponent(ActiveEffectsComponentId);
    if (effectsComponent) {
        for (const activeEffect of effectsComponent.effects) {
            const mod = activeEffect.modifiers[stat];
            if (mod) {
                contributors.push({
                    label: activeEffect.effect.name,
                    stat,
                    flat: mod.flat,
                    percent: mod.percent,
                });
            }
        }
    }

    return contributors;
}

function collectEquipmentModifiers(
    entity: Entity,
    flatSums: Record<StatType, number>,
    percentProducts: Record<StatType, number>,
): void {
    const equipmentComponent = entity.getEcsComponent(EquipmentComponentId);
    if (!equipmentComponent) {
        return;
    }

    for (const item of Object.values(equipmentComponent.slots)) {
        if (item?.statModifiers) {
            applyModifiers(item.statModifiers, flatSums, percentProducts);
        }
    }
}

function collectEffectModifiers(
    entity: Entity,
    flatSums: Record<StatType, number>,
    percentProducts: Record<StatType, number>,
): void {
    const effectsComponent = entity.getEcsComponent(ActiveEffectsComponentId);
    if (!effectsComponent) {
        return;
    }

    for (const activeEffect of effectsComponent.effects) {
        applyModifiers(activeEffect.modifiers, flatSums, percentProducts);
    }
}

function applyModifiers(
    modifiers: StatModifiers,
    flatSums: Record<StatType, number>,
    percentProducts: Record<StatType, number>,
): void {
    for (const stat of statTypes) {
        const mod = modifiers[stat];
        if (!mod) {
            continue;
        }
        if (mod.flat !== undefined) {
            flatSums[stat] += mod.flat;
        }
        if (mod.percent !== undefined) {
            percentProducts[stat] *= 1 + mod.percent;
        }
    }
}
