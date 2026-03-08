import type { Entity } from "../entity/entity.ts";
import type { ResolvedStats } from "../stat/statType.ts";

export type StatsComponent = {
    id: typeof StatsComponentId;
    baseStats: ResolvedStats;
    cache: ResolvedStats;
    dirty: boolean;
};

export const StatsComponentId = "stats";

const defaultStats: ResolvedStats = {
    might: 5,
    wit: 5,
    presence: 5,
    valor: 5,
};

export function createStatsComponent(
    base?: Partial<ResolvedStats>,
): StatsComponent {
    const baseStats: ResolvedStats = { ...defaultStats, ...base };
    return {
        id: StatsComponentId,
        baseStats,
        cache: { ...baseStats },
        dirty: true,
    };
}

export function markStatsDirty(entity: Entity): void {
    const component = entity.getEcsComponent(StatsComponentId);
    if (component) {
        (component as StatsComponent).dirty = true;
        entity.invalidateComponent(StatsComponentId);
    }
}
