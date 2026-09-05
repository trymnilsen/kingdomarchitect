import { encodePosition, type Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { collectLightClaims, computeLitTiles } from "./lightClaims.ts";

/**
 * Hearthlight is the defined "kingdom area" of a player. Its what would be
 * defended and hauled in
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
