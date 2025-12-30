import { RenderScope } from "./renderScope.ts";

export type RenderVisual = {
    onDraw(context: RenderScope): void;
};
