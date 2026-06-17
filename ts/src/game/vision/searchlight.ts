import type { Point } from "../../common/point.ts";
import type { Cardinal } from "../component/watchComponent.ts";

/**
 * Geometry for the night searchlight: a 90° wedge that is one quarter of the tower's
 * reach-diamond. The four cardinal wedges exactly partition the diamond (minus the
 * centre tile), so a full N→E→S→W sweep covers precisely the area the tower sees at
 * once by day.
 *
 * Quarter assignment is by dominant axis, ties (the diagonals, |dx| == |dy|) going to
 * the vertical (N/S) quarter, so every non-centre tile lands in exactly one quarter.
 */

export const SWEEP_ORDER: readonly Cardinal[] = ["N", "E", "S", "W"];

/** Whether the offset (dx, dy) from the tower falls in the wedge aimed `aim`. */
export function inWedge(dx: number, dy: number, aim: Cardinal): boolean {
    if (dx === 0 && dy === 0) {
        return false;
    }
    const vertical = Math.abs(dy) >= Math.abs(dx);
    switch (aim) {
        case "N":
            return vertical && dy < 0;
        case "S":
            return vertical && dy > 0;
        case "E":
            return !vertical && dx > 0;
        case "W":
            return !vertical && dx < 0;
    }
}

/** The cardinal quarter a point lies in, relative to the tower at `from`. */
export function quarterToward(from: Point, to: Point): Cardinal {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const vertical = Math.abs(dy) >= Math.abs(dx);
    if (vertical) {
        return dy <= 0 ? "N" : "S";
    }
    return dx > 0 ? "E" : "W";
}

/**
 * The tile offsets (centred on the tower) lit by the beam aimed `aim`, out to
 * `radius` (Manhattan). The quarter of the reach-diamond facing that direction.
 */
export function searchlightWedgeOffsets(
    aim: Cardinal,
    radius: number,
): Point[] {
    const offsets: Point[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
        const maxDy = radius - Math.abs(dx);
        for (let dy = -maxDy; dy <= maxDy; dy++) {
            if (inWedge(dx, dy, aim)) {
                offsets.push({ x: dx, y: dy });
            }
        }
    }
    return offsets;
}
