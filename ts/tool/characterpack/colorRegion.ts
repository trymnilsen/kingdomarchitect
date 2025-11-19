import type { Rectangle } from "../../src/common/structure/rectangle.js";

// Tuple representation: [x, y]
export type PixelPosition = [number, number];

export interface ColorRegion {
    name: string;
    boundingBox: Rectangle;
    pixels: PixelPosition[];
}
