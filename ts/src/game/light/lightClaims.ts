import { encodePosition, type Point } from "../../common/point.ts";
import { resolveLightSource } from "./resolveLightSource.ts";
import type { Entity } from "../entity/entity.ts";
import type { Phase } from "../component/dayComponent.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";

export type DiscLightClaim = {
    position: Point;
    radius: number;
};

export type PatternLightClaim = {
    position: Point;
    offsets: readonly Point[];
};

export type LightClaim = DiscLightClaim | PatternLightClaim;
export const LightClaimScope = {
    Illumination: "illumination",
    Hearthlight: "hearthlight",
} as const;
export type LightClaimScope =
    (typeof LightClaimScope)[keyof typeof LightClaimScope];

export function collectLightClaims(
    root: Entity,
    scope: LightClaimScope,
): LightClaim[] {
    const claims: LightClaim[] = [];
    const sources = root.queryComponents(LightSourceComponentId);
    for (const [entity, source] of sources) {
        const definition = resolveLightSource(entity, source);
        if (!definition) {
            continue;
        }
        if (scope === LightClaimScope.Hearthlight) {
            if (!source.claimsHearthlight) {
                continue;
            }
            const settlement = getSettlementEntity(entity);
            if (!settlement.hasComponent(PlayerKingdomComponentId)) {
                continue;
            }
        }
        if (source.pattern !== null) {
            claims.push({
                position: entity.worldPosition,
                offsets: source.pattern,
            });
        } else {
            claims.push({
                position: entity.worldPosition,
                radius: definition.lightRadius,
            });
        }
    }
    return claims;
}

/**
 * Stamps every claim's footprint into a set of packed tile ids using the
 * encode positon util.
 */
export function computeLitTiles(claims: readonly LightClaim[]): Set<number> {
    const litTiles = new Set<number>();
    for (const claim of claims) {
        if ("offsets" in claim) {
            for (const offset of claim.offsets) {
                litTiles.add(
                    encodePosition(
                        claim.position.x + offset.x,
                        claim.position.y + offset.y,
                    ),
                );
            }
        } else {
            const radius = claim.radius;
            const radiusSq = radius * radius;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy <= radiusSq) {
                        litTiles.add(
                            encodePosition(
                                claim.position.x + dx,
                                claim.position.y + dy,
                            ),
                        );
                    }
                }
            }
        }
    }
    return litTiles;
}

/**
 * Whether the sky alone lights every tile during this phase. Day, dawn and dusk
 * count as light. Night is dark, so placed sources only matter at night.
 */
export function ambientIsLight(phase: Phase): boolean {
    return phase !== "night";
}

/**
 * Whether a tile is lit right now: by ambient sky light, or by a source in the
 * already-built coverage set.
 */
export function isTileLit(
    litTiles: ReadonlySet<number>,
    phase: Phase,
    point: Point,
): boolean {
    if (ambientIsLight(phase)) {
        return true;
    }
    return litTiles.has(encodePosition(point.x, point.y));
}
