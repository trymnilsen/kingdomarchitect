import { RenderContext } from "./renderContext.js";

export interface RenderVisual {
    onDraw(context: RenderContext): void;
}
