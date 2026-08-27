import { encodePosition, type Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { collectLightClaims, computeLitTiles } from "./lightClaims.ts";

/**
 * Hearthlight is what the kingdom's own light illuminates right now. A sweeping
 * searchlight beam and a cresset that can be snuffed work the same way: when
 * the light leaves a tile, the claim leaves with it.
 *
 * There is no phase or ambient term. Daylight is the sky's light, not the
 * kingdom's, so it claims nothing and the claim set is the same at noon as at
 * midnight. Illumination is what can be seen; hearthlight is what is ours.
 *
 * `workerGlow` and the carried torch render without claiming, through their
 * definitions' `claimsHearthlight`. One is a presence affordance rather than a
 * light in the fiction, and the other would let territory follow feet.
 */
export function computeHearthlight(root: Entity): Set<number> {
    return computeLitTiles(collectLightClaims(root, "hearthlight"));
}

export function isInHearthlight(
    hearthlight: ReadonlySet<number>,
    point: Point,
): boolean {
    return hearthlight.has(encodePosition(point.x, point.y));
}
