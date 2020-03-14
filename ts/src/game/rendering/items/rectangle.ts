import { RenderNode, NodeConfiguration, RenderNodeType } from "./renderNode";
import { RenderContext } from "../renderContext";
import { RenderItem } from "../renderer";

export interface RectangleConfiguration extends NodeConfiguration {
    width: number;
    height: number;
    color: string;
    strokeWidth?: number;
    strokeColor?: string;
}

export function rectangle(config: RectangleConfiguration): RenderNode {
    return {
        type: RenderNodeType.rectangle,
        config: config,
        children: []
    };
}

export function rectangleRenderer(
    renderItem: RenderItem,
    context: CanvasRenderingContext2D
) {
    const config = renderItem.node.config as RectangleConfiguration;
    let rx = renderItem.transform.x;
    let ry = renderItem.transform.y;
    let rw = config.width;
    let rh = config.height;
    if (config.strokeWidth > 0) {
        rx += config.strokeWidth;
        ry += config.strokeWidth;
        rw -= config.strokeWidth * 2;
        rh -= config.strokeWidth * 2;
        const color = config.strokeColor || "black";
        context.fillStyle = color;
        context.fillRect(
            renderItem.transform.x,
            renderItem.transform.y,
            config.width,
            config.height
        );
    }
    context.fillStyle = config.color;
    context.fillRect(rx, ry, rw, rh);
}
/* 
export class Rectangle extends RenderNode {
    private config: RectangleConfiguration;
    public constructor(config: RectangleConfiguration) {
        super(config);
        this.config = config;
    }
    public render(context: CanvasRenderingContext2D): void {
        let rx = this.absolutePosition.x + this._screenSpacePosition.x;
        let ry = this.absolutePosition.y + this._screenSpacePosition.y;
        let rw = this.config.width;
        let rh = this.config.height;
        if (this.config.strokeWidth > 0) {
            rx += this.config.strokeWidth;
            ry += this.config.strokeWidth;
            rw -= this.config.strokeWidth * 2;
            rh -= this.config.strokeWidth * 2;
            const color = this.config.strokeColor || "black";
            context.fillStyle = color;
            context.fillRect(
                this.absolutePosition.x + this._screenSpacePosition.x,
                this.absolutePosition.y + this._screenSpacePosition.y,
                this.config.width,
                this.config.height
            );
        }
        context.fillStyle = this.config.color;
        context.fillRect(rx, ry, rw, rh);
    }
}
 */
