import { makeNumberId, type Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { collectLightClaims, computeLitTiles } from "./lightClaims.ts";

/**
 * Hearthlight is what the kingdom's own light illuminates, right now. A
 * sweeping searchlight beam and a cresset that can be snuffed are the same kind
 * of thing: when the light leaves a tile, the claim leaves with it.
 *
 * There is deliberately no phase or ambient term. Ambient daylight is the
 * sky's light rather than the kingdom's, so it claims nothing. The claim set
 * is identical at noon and midnight while the illumination of the world
 * differs. Illumination is "what can be seen". Hearthlight is "what is ours".
 *
 * `workerGlow` and the carried torch are the deliberate exceptions to
 * beam-equals-cresset. Neither is kingdom territory: one is a presence
 * affordance rather than a light in the fiction, the other would let territory
 * follow feet. Both render and neither claims (see their definitions'
 * `claimsHearthlight`).
 */
export function computeHearthlight(root: Entity): Set<number> {
    return computeLitTiles(collectLightClaims(root, "hearthlight"));
}

export function isInHearthlight(
    hearthlight: ReadonlySet<number>,
    point: Point,
): boolean {
    return hearthlight.has(makeNumberId(point.x, point.y));
}
