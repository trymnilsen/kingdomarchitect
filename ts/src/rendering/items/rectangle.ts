import { RenderItemConfiguration } from "./renderItemConfiguration";

export interface RectangleConfiguration extends RenderItemConfiguration {
    width: number;
    height: number;
    fill?: string;
    strokeWidth?: number;
    strokeColor?: string;
}

export function rectangleRenderer(
    config: RectangleConfiguration,
    context: CanvasRenderingContext2D
) {
    if (!!config.fill) {
        context.fillStyle = config.fill;
        context.fillRect(config.x, config.y, config.width, config.height);
    }

    if (!!config.strokeWidth && config.strokeWidth > 0) {
        const color = config.strokeColor || "black";
        context.lineWidth = config.strokeWidth;
        context.strokeStyle = color;
        context.strokeRect(config.x, config.y, config.width, config.height);
    }
}
