import { RenderScope } from "./renderContext.js";

export type RenderVisual = {
    onDraw(context: RenderScope): void;
};
