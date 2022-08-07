import { RenderContext } from "./renderContext";

export interface RenderVisual {
    onDraw(context: RenderContext): void;
}
