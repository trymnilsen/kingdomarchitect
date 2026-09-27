import {
    isAtOrAdjacent,
    pointEquals,
    type Point,
} from "../../../common/point.ts";
import { canAttackFrom } from "../../combat/attackReach.ts";
import type { AttackTarget } from "../../combat/attackTarget.ts";
import { resolveTargetPoint } from "../../combat/resolveTarget.ts";
import { resolveAttackProfile } from "../../combat/resolveAttackProfile.ts";
import type { Entity } from "../../entity/entity.ts";

/**
 * How close an entity has to be to its target for an action to happen.
 *
 * This is the single answer to that question. An action declares its reach
 * (see actionApproach.ts), the behavior system walks the entity into it, and
 * the walk's arrival test is this same reach, so a finished approach always
 * leaves the action in reach.
 *
 * - `on`: standing on the target tile. Leaving something at a chosen spot.
 * - `touch`: on the target tile or cardinally beside it. Anything done by hand.
 *   Standing on the target is allowed because nothing is gained by forbidding
 *   it: solid targets cannot be stood on anyway, and walkable ones such as
 *   ground piles or planting spots are naturally worked from on top.
 * - `near`: within one tile, diagonals included. Warmth radiates, so a fire
 *   warms whoever stands at its corner too.
 * - `attack`: wherever the attacker's weapon reaches the target with a clear
 *   line of sight.
 */
export type Reach =
    | { kind: "on" }
    | { kind: "touch" }
    | { kind: "near" }
    | { kind: "attack"; target: AttackTarget };

/**
 * Build the test for whether a tile is within `reach` of `destination`.
 * Resolved once and then applied to many tiles, because the pathfinder asks it
 * of every node it expands and the attack reach needs a profile and an impact
 * point that do not change between those calls.
 *
 * The attack reach ignores `destination` and follows the target itself, so a
 * walk planned against where a goblin stood still ends when it comes into range
 * wherever it has gone since.
 */
export function resolveReach(
    reach: Reach,
    entity: Entity,
    destination: Point,
): (point: Point) => boolean {
    switch (reach.kind) {
        case "on":
            return (point) => pointEquals(point, destination);
        case "touch":
            return (point) => isAtOrAdjacent(point, destination);
        case "near":
            return (point) => isWithinOneTile(point, destination);
        case "attack": {
            const root = entity.getRootEntity();
            const profile = resolveAttackProfile(entity);
            const impact = resolveTargetPoint(root, reach.target);
            if (!impact) {
                // No tile satisfies the reach, so a walk into it runs out of
                // path and fails
                return () => false;
            }
            return (point) => canAttackFrom(root, profile, point, impact);
        }
    }
}

export function isInReach(
    reach: Reach,
    entity: Entity,
    destination: Point,
): boolean {
    return resolveReach(reach, entity, destination)(entity.worldPosition);
}

function isWithinOneTile(a: Point, b: Point): boolean {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
}
