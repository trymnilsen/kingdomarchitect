import { RenderContext } from "./renderContext.js";

export type RenderVisual = {
    onDraw(context: RenderContext): void;
};
