import type { Point } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { DayComponentId } from "../component/dayComponent.ts";
import { type LightBand, brightestBand } from "./lightBand.ts";
import { collectLightEmitters } from "./lightEmitter.ts";

/**
 * The illumination field: the band a tile is lit to, right now, derived fresh on
 * every call. There is no stored grid and no caching by design — correctness and
 * simplicity first; performance is deferred until a profile demands it.
 *
 * This is the stable seam later stages build on: Stage 3 renders the bands and
 * Stage 4 combines this with per-viewer vision reach via `min(reach, band)`.
 * Illumination and vision reach are two separate fields and are never merged
 * into one radius here.
 *
 * @param root the world root entity
 * @param tilePosition the tile to evaluate, in world tile coordinates
 */
export function illuminationBandAt(root: Entity, tilePosition: Point): LightBand {
    const day = root.getEcsComponent(DayComponentId);
    const phase = day?.phase ?? "dawn";

    // Daytime is a free global light: the sun makes every tile bright, so it can
    // never produce dim or dark. Night removes that light and illumination
    // collapses to the local pools cast by placed sources. The day->night switch
    // is hard for now; no gradient.
    if (phase === "dawn" || phase === "day") {
        return "bright";
    }

    const emitters = collectLightEmitters(root);
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
