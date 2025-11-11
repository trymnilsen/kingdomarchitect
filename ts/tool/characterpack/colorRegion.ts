import type { Point } from "../../src/common/point.js";
import type { Rectangle } from "../../src/common/structure/rectangle.js";

export interface PixelPosition {
    x: number;
    y: number;
}

export interface ColorRegion {
    name: string;
    boundingBox: Rectangle;
    pixels: Point[];
}
