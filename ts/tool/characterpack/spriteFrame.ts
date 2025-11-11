import type { ColorRegion } from "./colorRegion.js";

export interface SpriteFrame {
    animationName: string;
    frameIndex: number;
    colorRegions: ColorRegion[];
}
