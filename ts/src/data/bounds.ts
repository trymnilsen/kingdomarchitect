import { Point } from "./point";

export function withinRectangle(
    point: Point,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}
