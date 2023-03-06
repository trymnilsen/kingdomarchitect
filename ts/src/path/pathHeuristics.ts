import { Point } from "../common/point";
import { GraphNode } from "./graph";

export function manhattanDistance(
    from: GraphNode | Point,
    to: GraphNode | Point
) {
    const d1 = Math.abs(to.x - from.x);
    const d2 = Math.abs(to.y - from.y);
    return d1 + d2;
}
