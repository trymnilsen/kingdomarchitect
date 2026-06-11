import type { Phase } from "../component/dayComponent.ts";
import {
    isInVisionReach,
    perceptionFloorAt,
    type VisibilityMapComponent,
} from "../component/visibilityMapComponent.ts";
import { bandFromEmitters } from "../light/illumination.ts";
import type { LightEmitter } from "../light/lightEmitter.ts";
import { brightestBand, type LightBand } from "../light/lightBand.ts";

/**
 * The band the player actually perceives at a tile —
 * `min(reach, max(perceptionFloor, illumination))`. Reach is the outer limit: a
 * tile out of every viewer's reach is `dark` however brightly it is lit. Within
 * reach, the tile reads as lit as it actually is, except that a viewer's minimal
 * perception can floor its immediate surroundings above darkness — a worker
 * perceives their own tile and the cardinal neighbours dimly even on an unlit
 * night, without casting any light into the world.
 *
 *  - Out of reach → `dark`, however brightly the tile is lit.
 *  - In reach → the brighter of the tile's illumination (`bandFromEmitters`:
 *    `bright` everywhere by day, at least `dim` during the dawn/dusk twilight
 *    ambient, the local light band by night) and the perception floor some
 *    viewer grants the tile.
 *
 * There is deliberately no day/night branch here. Reach already includes a source's
 * own light and a viewer's minimal perception (see `revealFootprintOffsets`), so
 * both are always within reach: by night this rule reveals every lit pool plus each
 * viewer's perceived plus, and by day the bright ambient washes both out. A worker
 * whose reach (2) outruns their minimal perception (1) sees only the perceived plus
 * on an unlit night, because the outer ring is in reach but floors at dark — the
 * single rule, no special case.
 *
 * `dark` therefore means "not perceivable right now" — out of reach, unlit and
 * unperceived — and `bright`/`dim` mean "seen to this level". Rendering keys off
 * that: bright and dim tiles show their entities and their tint; dark tiles fall
 * back to fog-of-war and hide their entities.
 *
 * Emitters and phase are passed in rather than queried so the render pass can gather
 * them once per frame; this function does no entity-tree query of its own. A tile
 * already lit bright short-circuits before the floor lookup — bright is the maximum
 * band, so the floor could never raise it — which skips the map probe entirely for
 * the whole day phase.
 *
 * @param visibilityMap the root visibility map holding the current reach set and
 * perception floor
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
    const litBand = bandFromEmitters(emitters, phase, { x, y });
    if (litBand === "bright") {
        return "bright";
    }
    return brightestBand(perceptionFloorAt(visibilityMap, x, y), litBand);
}
