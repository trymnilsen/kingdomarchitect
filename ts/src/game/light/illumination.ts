import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { DayComponentId, type Phase } from "../component/dayComponent.ts";
import { type LightBand, brightestBand } from "./lightBand.ts";
import { collectLightEmitters, type LightEmitter } from "./lightEmitter.ts";

/**
 * The free light the sky contributes to every tile during a phase: full daylight
 * by day, a dim twilight at dawn and dusk, nothing at night. Placed sources can
 * only raise a tile above this floor, never below it, so the cycle steps
 * dark -> dim -> bright -> dim -> dark instead of snapping between extremes.
 *
 * @param phase the current day/night phase
 */
export function ambientBandForPhase(phase: Phase): LightBand {
    switch (phase) {
        case "day":
            return "bright";
        case "dawn":
        case "dusk":
            return "dim";
        case "night":
            return "dark";
    }
}

/**
 * The band a tile is lit to by a known set of emitters during a known phase. This
 * is the core of the illumination field, split out so the render pass can gather
 * the emitters once per frame and evaluate every visible tile against that one
 * list instead of re-querying the entity tree per tile.
 *
 * The phase sets an ambient floor (see {@link ambientBandForPhase}) and emitters
 * can only raise a tile above it: by day the floor is already bright so sources
 * are ignored, at dawn and dusk only a source's bright pool stands out against
 * the dim field, and at night illumination collapses to the local pools cast by
 * placed sources.
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
    const ambient = ambientBandForPhase(phase);
    if (ambient === "bright") {
        return "bright";
    }

    let band: LightBand = ambient;
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
    // A world without a day component is fully visible, so default to day.
    const phase = day?.phase ?? "day";

    // A bright ambient cannot be raised by emitters, so skip the query entirely;
    // it is only needed when the ambient is dim or dark.
    if (ambientBandForPhase(phase) === "bright") {
        return "bright";
    }

    const emitters = collectLightEmitters(root);
    return bandFromEmitters(emitters, phase, tilePosition);
}
