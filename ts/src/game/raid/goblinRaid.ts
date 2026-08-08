import { log } from "../../common/logging/logger.ts";
import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";
import { GoblinCampComponentId } from "../component/goblinCampComponent.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import {
    PlayerKingdomComponentId,
    findPlayerKingdom,
} from "../component/playerKingdomComponent.ts";
import { BuildingComponentId } from "../component/buildingComponent.ts";
import { FireSourceComponentId } from "../component/fireSourceComponent.ts";
import {
    createRaidingComponent,
    RaidingComponentId,
} from "../component/raidingComponent.ts";
import { requestReplan } from "../component/BehaviorAgentComponent.ts";
import { kingdomScoreFromTargets } from "./kingdomScore.ts";
import {
    collectPlayerTargets,
    type PlayerTarget,
} from "./playerRaidTargets.ts";
import {
    INITIAL_RAID_THRESHOLD_BASE,
    RAIDERS_PER_TARGET,
    RAID_MIN_HOUSES,
    RAID_THRESHOLD_DISTANCE_FACTOR,
    RAID_THRESHOLD_GROWTH,
} from "./raidConstants.ts";

/**
 * Forms goblin night raids. Called once at the night phase edge
 * (phaseTransitionSystem). A camp marches when it is mature, full, and the
 * kingdom has grown rich enough to be worth the walk; it then commits all but
 * one goblin (the fire-tender / defender, chosen as the one closest to the
 * campfire) to a one-way raid, assigning each raider a player-building target.
 *
 * Raids are paced by prosperity rather than by a timer. Each camp holds the
 * kingdom score it is waiting for, and forming a raid restamps that bar above
 * the score the kingdom had that night. A raid that razes the settlement drops
 * the score far below the new bar, so the grace period is proportional to the
 * damage done; a raid that is beaten off leaves the score intact but the bar
 * standing above it, so the kingdom buys its peace by not growing. A kingdom
 * that stagnates is left alone, which is the intended bargain: raids are the
 * tax on prosperity.
 *
 * All raid coordination lives here because this is the only place with a global
 * view of both the warband and the available targets. After this runs, each
 * raider's RaidingComponent is the durable state that drives RaidBehavior. The
 * decision is never re-evaluated centrally and lives until the goblin dies.
 *
 * No flags or guards are needed: the night branch in phaseTransitionSystem is a
 * true once-per-night edge, and on save/resume mid-night the phase is already
 * "night" so this does not re-fire (the in-flight raid persists via components).
 */
export function formGoblinRaid(root: Entity): void {
    // One pass over the player's buildings feeds both halves of the decision:
    // what there is to take, and how much it is all worth.
    const playerTargets = collectPlayerTargets(root);
    const targets = rankedPlayerBuildingTargets(playerTargets);
    const score = kingdomScoreFromTargets(root, playerTargets);

    for (const [campEntity, camp] of root.queryComponents(
        GoblinCampComponentId,
    )) {
        // Goblins available to commit: present at the camp and not already on
        // a raid (RaidingComponent persists until death, since there is no retreat).
        const present = campEntity.children.filter(
            (child) =>
                child.hasComponent(GoblinUnitComponentId) &&
                !child.hasComponent(RaidingComponentId),
        );

        // Floor: a small camp never raids, which keeps the raid party from
        // degenerating to 0-1 goblins.
        if (camp.maxPopulation < RAID_MIN_HOUSES) {
            continue;
        }
        // Full: only strike once the camp has filled its houses ("grow then
        // strike"). Regrowing to full after a one-way raid is the cooldown.
        if (present.length < camp.maxPopulation) {
            continue;
        }
        // Seed the camp's bar the first time it is ever evaluated. It cannot be
        // set when the camp is built: the prefab entity has no parent yet, so
        // neither its final position nor the kingdom is reachable from there.
        if (camp.nextRaidThreshold <= 0) {
            camp.nextRaidThreshold = initialRaidThreshold(
                root,
                campEntity.worldPosition,
            );
            campEntity.invalidateComponent(GoblinCampComponentId);
            // Deliberately falls through to the gate below rather than skipping
            // the night: a camp seeded under a score it already clears should
            // march tonight, not a day late.
        }

        // Prosperity gate: the camp waits until the kingdom is worth the walk.
        if (score < camp.nextRaidThreshold) {
            log.debug("Goblin camp full but waiting for a richer kingdom", {
                campId: campEntity.id,
                score,
                threshold: camp.nextRaidThreshold,
            });
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
        const sorted = [...present].sort((a, b) => {
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

        // Restamp against the score as it stood before the raid lands. The
        // raiders are about to burn part of that score down, so the gap the
        // kingdom has to climb back widens with the damage they do. That is the
        // grace period, not an oversight in the ordering.
        camp.nextRaidThreshold = score * RAID_THRESHOLD_GROWTH;
        campEntity.invalidateComponent(GoblinCampComponentId);

        log.info("Goblin raid formed", {
            campId: campEntity.id,
            raiders: raiders.length,
            targets: Math.min(
                targets.length,
                Math.ceil(raiders.length / RAIDERS_PER_TARGET),
            ),
            score,
            nextThreshold: camp.nextRaidThreshold,
        });
    }
}

/**
 * The given player targets ranked as raid objectives: by raid value (desc), then
 * proximity to the world origin, then id for a stable order. See
 * collectPlayerTargets for what counts as worth taking.
 */
function rankedPlayerBuildingTargets(candidates: PlayerTarget[]): Entity[] {
    return [...candidates]
        .sort(byRaidPriority({ x: 0, y: 0 }))
        .map((candidate) => candidate.entity);
}

/**
 * The bar a camp at this position starts out waiting for, before it has ever
 * raided. Scaled by distance to the kingdom because every camp reads the same
 * score: without the spread, the night that score first crosses a shared bar
 * every eligible camp would march at once. Near camps covet the kingdom sooner;
 * far ones need a richer prize to make the walk worth it. Derived from world
 * layout, so it is deterministic with no RNG.
 *
 * Exported because it is the camp's opening terms rather than a private detail:
 * it is what any caller needs to reason about whether a camp will ever march.
 */
export function initialRaidThreshold(
    root: Entity,
    campPosition: Point,
): number {
    const distance = Math.sqrt(
        squaredDistance(campPosition, kingdomAnchor(root)),
    );
    return (
        INITIAL_RAID_THRESHOLD_BASE + distance * RAID_THRESHOLD_DISTANCE_FACTOR
    );
}

/**
 * Whether an entity id still refers to a live, player-owned building, which is
 * how a raider checks that its current target is still worth attacking.
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
 * yields to idle, the post-razing end state). Coordination across raiders is
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
    candidates.sort(byRaidPriority(from));
    return candidates[0].entity;
}

/**
 * Comparator ranking raid targets: highest raid value first, then closest to
 * `anchor` (squared distance), then id for a stable, deterministic order.
 */
function byRaidPriority(
    anchor: Point,
): (a: PlayerTarget, b: PlayerTarget) => number {
    return (a, b) => {
        if (a.value !== b.value) {
            return b.value - a.value;
        }
        const da = squaredDistance(a.entity.worldPosition, anchor);
        const db = squaredDistance(b.entity.worldPosition, anchor);
        if (da !== db) {
            return da - db;
        }
        return a.entity.id < b.entity.id ? -1 : 1;
    };
}

/**
 * The point camps measure their distance to when seeding a first raid threshold.
 * Falls back to the world origin, the same convention rankedPlayerBuildingTargets
 * uses, and is kept separate from initialRaidThreshold so the anchor can move
 * without the formula being touched.
 */
function kingdomAnchor(root: Entity): Point {
    return findPlayerKingdom(root)?.worldPosition ?? { x: 0, y: 0 };
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
