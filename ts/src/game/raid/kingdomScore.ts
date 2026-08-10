import type { Entity } from "../entity/entity.ts";
import { countPlayerWorkers } from "../component/playerKingdomComponent.ts";
import {
    collectPlayerTargets,
    type PlayerTarget,
} from "./playerRaidTargets.ts";
import { WORKER_SCORE } from "./raidWorth.ts";

/**
 * How rich the player kingdom looks to a goblin: the raid value of everything
 * worth taking, plus its workers. This is what paces raids, so the number
 * doubles as the player's threat clock.
 *
 * Derived on read, with nothing cached or stored, because every input is already
 * in the entity tree and a stale wealth figure would silently mis-time raids.
 *
 * Buildings valued at 0 (walls, gates, roads) contribute nothing, and that is
 * the point: fortification is not loot. A player who answers raids by walling in
 * does not thereby invite bigger ones, so defensive spending buys safety twice.
 */
export function kingdomScore(root: Entity): number {
    return kingdomScoreFromTargets(root, collectPlayerTargets(root));
}

/**
 * kingdomScore for a caller that has already collected the player's targets, so
 * a single evaluation does not scan every building twice. Same formula and same
 * result: kingdomScore(root) is exactly this with the collection done for you.
 */
export function kingdomScoreFromTargets(
    root: Entity,
    playerTargets: readonly PlayerTarget[],
): number {
    let score = 0;
    for (const target of playerTargets) {
        score += target.value;
    }
    return score + countPlayerWorkers(root) * WORKER_SCORE;
}
