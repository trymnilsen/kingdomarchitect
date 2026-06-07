import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { DayComponentId, type Phase } from "../component/dayComponent.ts";
import { type LightBand, brightestBand } from "./lightBand.ts";
import { collectLightEmitters, type LightEmitter } from "./lightEmitter.ts";

/**
 * The band a tile is lit to by a known set of emitters during a known phase. This
 * is the core of the illumination field, split out so the render pass can gather
 * the emitters once per frame and evaluate every visible tile against that one
 * list instead of re-querying the entity tree per tile.
 *
 * Daytime is a free global light: the sun makes every tile bright, so the emitter
 * list is ignored and the result is always bright. Night (and dusk, until the
 * dusk gradient lands) removes that light and illumination collapses to the local
 * pools cast by placed sources. The day->night switch is hard for now; no
 * gradient.
 *
 * @param emitters every light source in the world, already resolved
 * @param phase the current day/night phase
 * @param tilePosition the tile to evaluate, in world tile coordinates
 */
export function bandFromEmitters(
    emitters: readonly LightEmitter[],
    phase: Phase,
    tilePosition: Point,
): LightBand {
    if (phase === "dawn" || phase === "day") {
        return "bright";
    }

    let band: LightBand = "dark";
    for (const emitter of emitters) {
        const dx = emitter.position.x - tilePosition.x;
        const dy = emitter.position.y - tilePosition.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq <= emitter.brightRadiusSq) {
            // Bright is the strongest band, so no other source can raise it.
            return "bright";
        }
        if (distanceSq <= emitter.dimRadiusSq) {
            band = brightestBand(band, "dim");
        }
    }
    return band;
}

/**
 * The illumination field: the band a tile is lit to, right now, derived fresh on
 * every call. There is no stored grid and no caching by design — correctness and
 * simplicity first; performance is deferred until a profile demands it.
 *
 * This is the single-shot form for callers that evaluate one tile in isolation
 * (the selection readout, the debug overlay). The render pass instead gathers
 * emitters once and calls {@link bandFromEmitters} per tile, so it must not pay a
 * full emitter query for every tile.
 *
 * Illumination and vision reach are two separate fields and are never merged into
 * one radius here; the combination happens later via the perceived-band rule.
 *
 * @param root the world root entity
 * @param tilePosition the tile to evaluate, in world tile coordinates
 */
export function illuminationBandAt(root: Entity, tilePosition: Point): LightBand {
    const day = root.getEcsComponent(DayComponentId);
    const phase = day?.phase ?? "dawn";

    // During the day the band is bright regardless of emitters, so skip the query
    // entirely; it is only ever needed at night.
    if (phase === "dawn" || phase === "day") {
        return "bright";
    }

    const emitters = collectLightEmitters(root);
    return bandFromEmitters(emitters, phase, tilePosition);
}
