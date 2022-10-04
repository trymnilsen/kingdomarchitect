import { NinePatchImageConfiguration } from "./items/image";

export interface UIRenderContext {
    drawNinePatchImage(image: NinePatchImageConfiguration): void;
}
