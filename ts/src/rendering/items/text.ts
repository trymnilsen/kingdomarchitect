/* 
import { RenderNode, NodeConfiguration, RenderNodeType } from "./renderNode";
import { RenderContext } from "../renderContext";
import { RenderItem } from "../renderer";

export interface TextConfiguration extends NodeConfiguration {
    text: string;
    color: string;
    align?: "left" | "center" | "right";
    weight?: "normal" | "bold";
}

export function text(textConfig: TextConfiguration): RenderNode {
    return {
        type: RenderNodeType.text,
        config: textConfig,
        children: [],
    };
}

export function textRenderer(
    renderItem: RenderItem,
    context: CanvasRenderingContext2D
) {
    const config = renderItem.node.config as TextConfiguration;
    let fontString = "14px Arial";
    if (!!config.weight) {
        fontString = config.weight + " " + fontString;
    }
    context.fillStyle = config.color;
    context.font = fontString;
    context.textBaseline = "top";
    context.fillText(
        config.text,
        renderItem.transform.x,
        renderItem.transform.y
    );
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
