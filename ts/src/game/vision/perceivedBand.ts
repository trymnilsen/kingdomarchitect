import type { Phase } from "../component/dayComponent.ts";
import {
    isInVisionReach,
    type VisibilityMapComponent,
} from "../component/visibilityMapComponent.ts";
import { bandFromEmitters } from "../light/illumination.ts";
import type { LightEmitter } from "../light/lightEmitter.ts";
import type { LightBand } from "../light/lightBand.ts";

/**
 * The band the player actually perceives at a tile: the smaller of the two limits
 * on sight, vision reach and illumination — `min(reach, illumination)`. A tile is
 * seen only where the player has reach *and* the tile is lit; the dimmer of the two
 * binds.
 *
 *  - Out of reach → `dark`, however brightly the tile is lit.
 *  - In reach → exactly how lit the tile is (`bandFromEmitters`), which is `bright`
 *    everywhere by day and the local light band by night.
 *
 * There is deliberately no day/night branch here. Reach already includes a source's
 * own light (see `revealFootprintOffsets`), so a light pool is always within its own
 * reach: by night this rule reveals every lit pool, and by day it shows the whole
 * reach footprint bright. A worker whose reach (2) outruns its glow (1) sees only
 * the lit plus at night, because the unlit ring is in reach but dark — the single
 * rule, no special case.
 *
 * `dark` therefore means "not perceivable right now" — out of reach or unlit — and
 * `bright`/`dim` mean "seen, and lit to this level". Rendering keys off that: bright
 * and dim tiles show their entities and their lit tint; dark tiles fall back to
 * fog-of-war and hide their entities.
 *
 * Emitters and phase are passed in rather than queried so the render pass can gather
 * them once per frame; this function does no entity-tree query of its own.
 *
 * @param visibilityMap the root visibility map holding the current reach set
 * @param emitters every light source in the world, already resolved
 * @param phase the current day/night phase
 * @param x tile x in world coordinates
 * @param y tile y in world coordinates
 */
export function perceivedBandAt(
    visibilityMap: VisibilityMapComponent,
    emitters: readonly LightEmitter[],
    phase: Phase,
    x: number,
    y: number,
): LightBand {
    if (!isInVisionReach(visibilityMap, x, y)) {
        return "dark";
    }
    return bandFromEmitters(emitters, phase, { x, y });
}
