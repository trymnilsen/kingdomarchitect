import type { ColorRegion } from "./colorRegion.ts";

export interface SpriteFrame {
    animationName: string;
    frameIndex: number;
    colorRegions: ColorRegion[];
}
