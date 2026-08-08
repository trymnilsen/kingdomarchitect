import type { EcsSystem } from "../../ecs/ecsSystem.ts";
import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { DayComponentId } from "../component/dayComponent.ts";
import {
    WatchComponentId,
    type Cardinal,
} from "../component/watchComponent.ts";
import { GoblinUnitComponentId } from "../component/goblinUnitComponent.ts";
import { STATION_MANNED_REACH } from "../vision/visionReach.ts";
import { SWEEP_ORDER, inWedge, quarterToward } from "../vision/searchlight.ts";
import { isTowerManned } from "../component/stationQuery.ts";

/**
 * Ticks the auto-sweep dwells on each quarter before advancing. The key
 * night-difficulty knob: faster ≈ always-on vision, slower lets raiders slip
 * between passes.
 */
const SEARCHLIGHT_SWEEP_TICKS = 8;

/**
 * Drives the night searchlight on manned towers. Owns where the beam points
 * (`beamAim`) and which hostile it is following (`lockedOn`); the render pass reads
 * `beamAim` to light the wedge.
 *
 * Auto mode sweeps N→E→S→W and, when the swept quarter catches a hostile in range,
 * locks on and follows it (re-aiming as it moves) until it leaves reach or dies —
 * turning a glimpse into tracking. A fixed mode just holds the chosen quarter. The
 * lock target is re-validated every tick, so it cannot get stuck pointing at a dead
 * or vanished entity. Dormant when the tower is unmanned or it is not night.
 */
export const watchSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, tick: number) {
    const phase = root.getEcsComponent(DayComponentId)?.phase;
    const isNight = phase === "night";

    for (const [tower, watch] of root.queryComponents(WatchComponentId)) {
        const prevAim = watch.beamAim;
        const prevLock = watch.lockedOn;

        if (!isNight || !isTowerManned(root, tower)) {
            watch.lockedOn = null;
        } else if (watch.searchlight !== "auto") {
            watch.beamAim = watch.searchlight;
            watch.lockedOn = null;
        } else {
            let target = watch.lockedOn
                ? hostileInReach(root, tower, watch.lockedOn)
                : null;

            if (!target) {
                // Sweep, then try to catch a hostile in the freshly-lit quarter.
                watch.beamAim =
                    SWEEP_ORDER[
                        Math.floor(tick / SEARCHLIGHT_SWEEP_TICKS) %
                            SWEEP_ORDER.length
                    ];
                target = nearestHostileInQuarter(root, tower, watch.beamAim);
            }

            if (target) {
                watch.beamAim = quarterToward(
                    tower.worldPosition,
                    target.worldPosition,
                );
                watch.lockedOn = target.id;
            } else {
                watch.lockedOn = null;
            }
        }

        if (watch.beamAim !== prevAim || watch.lockedOn !== prevLock) {
            tower.invalidateComponent(WatchComponentId);
        }
    }
}

/** Manhattan distance — the reach metric. */
function reachDistance(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** The locked entity, if it still exists, is hostile, and is within beam reach. */
function hostileInReach(
    root: Entity,
    tower: Entity,
    id: string,
): Entity | null {
    const entity = root.findEntity(id);
    if (!entity || !entity.hasComponent(GoblinUnitComponentId)) {
        return null;
    }
    if (
        reachDistance(tower.worldPosition, entity.worldPosition) >
        STATION_MANNED_REACH
    ) {
        return null;
    }
    return entity;
}

/** Nearest hostile within reach that lies in the given quarter, or null. */
function nearestHostileInQuarter(
    root: Entity,
    tower: Entity,
    aim: Cardinal,
): Entity | null {
    let best: Entity | null = null;
    let bestDistance = Infinity;
    for (const [goblin] of root.queryComponents(GoblinUnitComponentId)) {
        const dx = goblin.worldPosition.x - tower.worldPosition.x;
        const dy = goblin.worldPosition.y - tower.worldPosition.y;
        const d = Math.abs(dx) + Math.abs(dy);
        if (d > STATION_MANNED_REACH || d === 0) {
            continue;
        }
        if (!inWedge(dx, dy, aim)) {
            continue;
        }
        if (d < bestDistance) {
            best = goblin;
            bestDistance = d;
        }
    }
    return best;
}
