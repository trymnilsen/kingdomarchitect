import { makeNumberId, type Point } from "../../common/point.ts";
import { resolveLightSource } from "./resolveLightSource.ts";
import type { Entity } from "../entity/entity.ts";
import type { Phase } from "../component/dayComponent.ts";
import { LightSourceComponentId } from "../component/lightSourceComponent.ts";
import { PlayerKingdomComponentId } from "../component/playerKingdomComponent.ts";
import { getSettlementEntity } from "../entity/settlementQueries.ts";

/**
 * Lit coverage is derived, never stored. These are pure functions over an
 * entity tree. Share the function, never the data: no factory injection, no
 * component, no cached grid, no serialization. Server and client each derive
 * over their own tree. The server derives on its update interval (the hearth
 * defense system) and the client derives per render frame. All stamping, discs
 * and patterns alike, lives in this module and nowhere else, so client and
 * server can never disagree about a tile's lit-ness except by holding different
 * entity state. Client-built coverage is presentational only. It may draw. It
 * may never gate logic. This split holds in singleplayer's shared context and
 * is mandatory in multiplayer's hosted topology.
 *
 * There is deliberately no viewport parameter. Cost is driven by claim count
 * rather than camera, so viewport culling would save a fraction of an already
 * cheap pass while adding radius-inflated-bounds edge bugs (pool edges popping
 * during pans) and forking client output from server output. If a profile ever
 * shows the client rebuild mattering, the correct future optimization is
 * temporal (a cache keyed on a light-claims revision counter), never spatial.
 *
 * Terminology: this is coverage, a union of stamped footprints. Nothing here is
 * a "cluster". Connectivity clustering was designed and explicitly deleted.
 */

/**
 * A claim lighting a disc around its position. The common case, so it carries
 * no offset allocation. Radius 0 legitimately lights the claim's own tile
 * because `dx*dx + dy*dy <= 0` holds at distance zero. There is no sentinel for
 * "emits nothing". An entity that emits nothing has no light component at all.
 */
export type DiscLightClaim = {
    position: Point;
    radius: number;
    claimsHearthlight: boolean;
};

/**
 * A claim lighting exactly its offsets, verbatim. This is how a light gets a
 * non-circular shape (the watchtower's searchlight wedge) without the coverage
 * code knowing why.
 */
export type PatternLightClaim = {
    position: Point;
    offsets: readonly Point[];
    claimsHearthlight: boolean;
};

export type LightClaim = DiscLightClaim | PatternLightClaim;

/**
 * Scopes are named for what they feed. The hearthlight scope is already several
 * filters deep, so a name like "player" would become a lie with the next
 * filter.
 */
export type LightClaimScope = "illumination" | "hearthlight";

/**
 * Gathers every light claim in the world, freshly, on each call.
 *
 * Claims are phase-independent and existence-gated only. A cresset claims at
 * noon just like the beam of a manned tower. Whether anything renders
 * differently is ambient's business rather than the claim's. A sweeping
 * searchlight and a snuffable cresset are the same kind of thing: present while
 * lit, gone when not.
 *
 * What each source emits is resolved per entity by {@link resolveLightSource},
 * so a worker's carried torch reaches this code as an ordinary definition. Who
 * emits at all is still decided here, by the component query alone.
 *
 * The `"hearthlight"` scope keeps claims whose settlement ancestry resolves to
 * the player kingdom and whose definition claims hearthlight. Without the
 * `claimsHearthlight` filter every worker would be walking hearthlight: the
 * home region would get dragged around the map, and the defenders-inside-
 * hearthlight gate in the defense system would be silently nullified because
 * every aggressive worker always stands inside their own one-tile glow. The
 * glow renders. It does not claim. A carried torch is dropped by that same
 * branch, for that same reason.
 *
 * No scaffold check is needed. Light components only attach when construction
 * finishes (see `applyFunctionalComponents`), so a half-built building has no
 * claim to filter out.
 */
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
        if (scope === "hearthlight") {
            if (!definition.claimsHearthlight) {
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
                claimsHearthlight: definition.claimsHearthlight,
            });
        } else {
            claims.push({
                position: entity.worldPosition,
                radius: definition.lightRadius,
                claimsHearthlight: definition.claimsHearthlight,
            });
        }
    }
    return claims;
}

/**
 * Stamps every claim's footprint into a set of packed tile ids. Disc claims use
 * the squared-euclidean test so no tile changes lit-ness against the old
 * per-tile distance scan. Pattern claims stamp their offsets verbatim.
 *
 * Cost is O(claims x footprint area), a few thousand set-adds, replacing the
 * old per-visible-tile times per-source distance scanning. Coverage is rebuilt
 * fresh each pass, so a moving light costs nothing extra: the sweeping beam is
 * exactly as cheap as a static lamp.
 */
export function computeLitTiles(claims: readonly LightClaim[]): Set<number> {
    const litTiles = new Set<number>();
    for (const claim of claims) {
        if ("offsets" in claim) {
            for (const offset of claim.offsets) {
                litTiles.add(
                    makeNumberId(
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
                            makeNumberId(
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
 * count as light. Night is dark, so placed sources only matter at night. Dawn
 * and dusk previously rendered as a dim twilight. That look is gone by
 * decision. A phase-driven render palette is future polish, and the simulation
 * stays boolean either way.
 */
export function ambientIsLight(phase: Phase): boolean {
    return phase !== "night";
}

/**
 * Whether a tile is lit right now: by ambient sky light, or by a source in the
 * already-built coverage set. Callers should skip building the set entirely
 * during light-ambient phases, since the ambient short-circuit makes it
 * unnecessary.
 */
export function isTileLit(
    litTiles: ReadonlySet<number>,
    phase: Phase,
    point: Point,
): boolean {
    if (ambientIsLight(phase)) {
        return true;
    }
    return litTiles.has(makeNumberId(point.x, point.y));
}
