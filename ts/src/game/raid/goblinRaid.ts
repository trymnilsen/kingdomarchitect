import { log } from "../../common/logging/logger.ts";
import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";
import { GoblinCampComponentId } from "../component/goblinCampComponent.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { FireSourceComponentId } from "../component/fireSourceComponent.ts";
import { createRaidingComponent } from "../component/raidingComponent.ts";
import { requestReplan } from "../component/BehaviorAgentComponent.ts";
import { DEFAULT_RAID_VALUE, RAIDERS_PER_TARGET } from "./raidConstants.ts";

/**
 * Forms goblin night raids. Called once at the night phase edge
 * (phaseTransitionSystem). For every camp at full population it commits all but
 * one goblin (the fire-tender / defender, chosen as the one closest to the
 * campfire) to a one-way raid, assigning each raider a player-building target.
 *
 * All raid coordination lives here because this is the only place with a global
 * view of both the warband and the available targets. After this runs, each
 * raider's RaidingComponent is the durable state that drives RaidBehavior — the
 * decision is never re-evaluated centrally; it lives until the goblin dies.
 *
 * No flags or guards are needed: the night branch in phaseTransitionSystem is a
 * true once-per-night edge, and on save/resume mid-night the phase is already
 * "night" so this does not re-fire (the in-flight raid persists via components).
 */
export function formGoblinRaid(root: Entity): void {
    const targets = rankedPlayerBuildingTargets(root);

    for (const [campEntity, camp] of root.queryComponents(
        GoblinCampComponentId,
    )) {
        const goblins = campEntity.children.filter((child) =>
            child.hasComponent(GoblinUnitComponentId),
        );

        // Only raid at full strength — this is the "grow then strike" pacing.
        if (goblins.length < camp.maxPopulation) {
            continue;
        }

        if (targets.length === 0) {
            log.info("Goblin camp ready to raid but no player targets exist", {
                campId: campEntity.id,
            });
            continue;
        }

        // Defender = goblin closest to the campfire (id breaks distance ties so
        // the choice is deterministic). It is left un-stamped: it falls through
        // to keepWarm (stays by the fire) and engageInCombat (defends the camp).
        const anchor = campfireAnchor(campEntity);
        const sorted = [...goblins].sort((a, b) => {
            const da = squaredDistance(a.worldPosition, anchor);
            const db = squaredDistance(b.worldPosition, anchor);
            if (da !== db) {
                return da - db;
            }
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
        const raiders = sorted.slice(1);

        // Round-robin ~RAIDERS_PER_TARGET raiders across the ranked targets;
        // extras stack onto the highest-value targets.
        raiders.forEach((raider, index) => {
            const targetIndex = Math.min(
                Math.floor(index / RAIDERS_PER_TARGET),
                targets.length - 1,
            );
            const target = targets[targetIndex];
            raider.setEcsComponent(createRaidingComponent(target.id));
            requestReplan(raider);
        });

        log.info("Goblin raid formed", {
            campId: campEntity.id,
            raiders: raiders.length,
            targets: Math.min(targets.length, Math.ceil(raiders.length / RAIDERS_PER_TARGET)),
        });
    }
}

/**
 * All non-scaffolded player buildings that are valid raid objectives, ranked by
 * raid value (desc), then proximity to the world origin, then id for a stable
 * order. Buildings with an explicit raidValue of 0 (walls, gates) and roads are
 * excluded — they are obstacles handled by the siege path, never objectives.
 */
function rankedPlayerBuildingTargets(root: Entity): Entity[] {
    const candidates = collectPlayerTargets(root);
    candidates.sort((a, b) => {
        if (a.value !== b.value) {
            return b.value - a.value;
        }
        const da = squaredDistance(a.entity.worldPosition, { x: 0, y: 0 });
        const db = squaredDistance(b.entity.worldPosition, { x: 0, y: 0 });
        if (da !== db) {
            return da - db;
        }
        return a.entity.id < b.entity.id ? -1 : 1;
    });
    return candidates.map((candidate) => candidate.entity);
}

/**
 * Whether an entity id still refers to a live, player-owned building — i.e. a
 * raider's current target is still worth attacking.
 */
export function isLivePlayerBuilding(root: Entity, entityId: string): boolean {
    const entity = root.findEntity(entityId);
    if (!entity || !entity.hasComponent(BuildingComponentId)) {
        return false;
    }
    return getSettlementEntity(entity).hasComponent(PlayerKingdomComponentId);
}

/**
 * Picks a replacement target for a raider whose current target was destroyed:
 * the highest-value remaining player building, breaking ties by proximity to
 * the raider. Returns null when no player buildings remain (the raider then
 * yields to idle — the post-razing end state). Coordination across raiders is
 * intentionally loose here; by the endgame, fan-out no longer matters.
 */
export function findReplacementTarget(
    root: Entity,
    from: Point,
): Entity | null {
    const candidates = collectPlayerTargets(root);
    if (candidates.length === 0) {
        return null;
    }
    candidates.sort((a, b) => {
        if (a.value !== b.value) {
            return b.value - a.value;
        }
        const da = squaredDistance(a.entity.worldPosition, from);
        const db = squaredDistance(b.entity.worldPosition, from);
        if (da !== db) {
            return da - db;
        }
        return a.entity.id < b.entity.id ? -1 : 1;
    });
    return candidates[0].entity;
}

function collectPlayerTargets(
    root: Entity,
): { entity: Entity; value: number }[] {
    const candidates: { entity: Entity; value: number }[] = [];
    for (const [entity, building] of root.queryComponents(
        BuildingComponentId,
    )) {
        if (building.scaffolded) {
            continue;
        }
        if (building.building.id === "road") {
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

function campfireAnchor(campEntity: Entity): Point {
    for (const child of campEntity.children) {
        const fireSource = child.getEcsComponent(FireSourceComponentId);
        if (!fireSource?.isActive) {
            continue;
        }
        const building = child.getEcsComponent(BuildingComponentId);
        if (!building || !building.scaffolded) {
            return child.worldPosition;
        }
    }
    return campEntity.worldPosition;
}

function squaredDistance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}
