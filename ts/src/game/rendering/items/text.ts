import { RenderNode, NodeConfiguration } from "./renderNode";
import { RenderContext } from "../renderContext";

/* export interface TextConfiguration extends NodeConfiguration {
    text: string;
    color: string;
    align?: "left" | "center" | "right";
}

export class TextVisual extends RenderNode {
    private config: TextConfiguration;
    public constructor(config: TextConfiguration) {
        super(config);
        this.config = config;
    }
    public render(context: CanvasRenderingContext2D): void {
        let rx = this.absolutePosition.x + this._screenSpacePosition.x;
        let ry = this.absolutePosition.y + this._screenSpacePosition.y;

        context.fillStyle = this.config.color;
        context.font = "16px Arial";
        context.textAlign = this.config.align || "left";
        context.fillText(this.config.text, rx, ry);
        context.textAlign = "left";
    }
}
 */
