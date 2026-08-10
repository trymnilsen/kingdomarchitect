import type { Entity } from "../entity/entity.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { DEFAULT_RAID_VALUE } from "./raidWorth.ts";

export type PlayerTarget = { entity: Entity; value: number };

/**
 * Every player building the goblins consider worth taking, paired with its raid
 * value. This is the single definition of "worth taking", shared by raid target
 * selection and by kingdomScore, so the two can never disagree about what the
 * kingdom's wealth consists of.
 *
 * Scaffolding is skipped because a half-built frame is neither loot nor a prize,
 * and buildings valued at 0 or less (walls, gates, roads) are skipped because
 * they are obstacles rather than objectives: the siege path breaks through them
 * when they block the route, but no raider ever marches out for one.
 */
export function collectPlayerTargets(root: Entity): PlayerTarget[] {
    const candidates: PlayerTarget[] = [];
    for (const [entity, building] of root.queryComponents(
        BuildingComponentId,
    )) {
        if (building.scaffolded) {
            continue;
        }
        if (
            !getSettlementEntity(entity).hasComponent(PlayerKingdomComponentId)
        ) {
            continue;
        }
        const value = building.building.raidValue ?? DEFAULT_RAID_VALUE;
        if (value <= 0) {
            continue;
        }
        candidates.push({ entity, value });
    }
    return candidates;
}
