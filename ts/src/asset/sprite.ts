import { Bounds } from "../common/bounds";
import { assets } from "./assets";

export type Sprite = {
    bounds: Bounds;
    asset: keyof typeof assets;
};
