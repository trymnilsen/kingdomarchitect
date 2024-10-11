import { RenderScope } from "./renderScope.js";

export type RenderVisual = {
    onDraw(context: RenderScope): void;
};
