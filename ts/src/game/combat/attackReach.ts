import {
    addPoint,
    distanceSquared,
    encodePosition,
    type Point,
} from "../../common/point.ts";
import { generateDiscPattern } from "../../common/pattern.ts";
import type { AttackProfileDefinition } from "../../data/combat/attackProfileDefinition.ts";
import type { Entity } from "../entity/entity.ts";
import { hasLineOfSight } from "./lineOfSight.ts";

/** In reach, ignoring anything in the way. Standing on the target never counts */
export function isWithinReach(
    profile: AttackProfileDefinition,
    from: Point,
    to: Point,
): boolean {
    const separation = distanceSquared(from, to);
    return separation > 0 && separation <= profile.range * profile.range;
}

/** Reach first. It is two subtractions where sight walks tiles */
export function canAttackFrom(
    root: Entity,
    profile: AttackProfileDefinition,
    from: Point,
    impact: Point,
): boolean {
    return (
        isWithinReach(profile, from, impact) &&
        hasLineOfSight(root, from, impact)
    );
}

/** Packed ids for every tile this attacker could hit from where it stands */
export function attackFootprint(
    root: Entity,
    profile: AttackProfileDefinition,
    from: Point,
): Set<number> {
    const reachable = new Set<number>();
    for (const offset of generateDiscPattern(profile.range)) {
        const tile = addPoint(from, offset);
        if (!canAttackFrom(root, profile, from, tile)) {
            continue;
        }
        reachable.add(encodePosition(tile.x, tile.y));
    }
    return reachable;
}
