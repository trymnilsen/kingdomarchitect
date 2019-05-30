import { RenderNode, NodeConfiguration } from "./renderNode";
import { RenderContext } from "../renderContext";

export interface RectangleConfiguration extends NodeConfiguration {
    width: number;
    height: number;
    color: string;
    strokeWidth?: number;
    strokeColor?: string;
}

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
