/* 
import { RenderNode, NodeConfiguration, RenderNodeType } from "./renderNode";
import { RenderContext } from "../renderContext";
import { RenderItem } from "../renderer";


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

import { RenderItemConfiguration } from "./renderItemConfiguration";

export interface TextConfiguration extends RenderItemConfiguration {
    text: string;
    color: string;
    align?: "left" | "center" | "right";
    weight?: "normal" | "bold";
}

export function textRenderer(
    renderItem: TextConfiguration,
    context: CanvasRenderingContext2D
) {
    let fontString = "14px Arial";
    if (!!renderItem.weight) {
        fontString = renderItem.weight + " " + fontString;
    }
    context.fillStyle = renderItem.color;
    context.font = fontString;
    context.textBaseline = "top";
    context.fillText(renderItem.text, renderItem.x, renderItem.y);
}
