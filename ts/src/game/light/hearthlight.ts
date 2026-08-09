import { makeNumberId, type Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { collectLightClaims, computeLitTiles } from "./lightClaims.ts";

/**
 * Hearthlight is what the kingdom's own light illuminates, right now. A
 * sweeping searchlight beam and a torch that can be snuffed are the same kind
 * of thing: when the light leaves a tile, the claim leaves with it.
 *
 * There is deliberately no phase or ambient term. Ambient daylight is the
 * sky's light rather than the kingdom's, so it claims nothing. The claim set
 * is identical at noon and midnight while the illumination of the world
 * differs. Illumination is "what can be seen". Hearthlight is "what is ours".
 *
 * `workerGlow` is the one deliberate exception to beam-equals-torch: a
 * presence affordance rather than a light in the fiction. It renders and never
 * claims (see its definition's `claimsHearthlight`).
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
