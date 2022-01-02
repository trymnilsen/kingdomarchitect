import { Axis } from "./direction";
import { Point } from "./point";
import { NumberRange } from "./range";

export function withinRectangle(
    point: Point,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}

export interface Bounds {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export function getBoundsAxis(bounds: Bounds, axis: Axis): NumberRange {
    switch (axis) {
        case Axis.XAxis:
            return {
                min: bounds.x1,
                max: bounds.x2,
            };
        case Axis.YAxis:
            return {
                min: bounds.y1,
                max: bounds.y2,
            };
    }
}
