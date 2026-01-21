import type { CanvasContext } from "../canvasContext.ts";
import type { RenderItemConfiguration } from "./renderItemConfiguration.ts";

export type RectangleConfiguration = {
    width: number;
    height: number;
    fill?: string;
    strokeWidth?: number;
    strokeColor?: string;
} & RenderItemConfiguration;

export function rectangleRenderer(
    config: RectangleConfiguration,
    context: CanvasContext,
) {
    if (config.fill) {
        context.fillStyle = config.fill;
        context.fillRect(config.x, config.y, config.width, config.height);
    }

    if (!!config.strokeWidth && config.strokeWidth > 0) {
        const color = config.strokeColor ?? "black";
        context.lineWidth = config.strokeWidth;
        context.strokeStyle = color;
        context.strokeRect(config.x, config.y, config.width, config.height);
    }
}
