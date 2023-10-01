/* 
import { RenderNode, NodeConfiguration, RenderNodeType } from "./renderNode.js";
import { RenderContext } from "../renderContext.js";
import { RenderItem } from "../renderer.js";


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

import { RenderItemConfiguration } from "./renderItemConfiguration.js";

export type TextConfiguration = {
    text: string;
    color: string;
    font: string;
    size: number;
    align?: "left" | "center" | "right";
    width?: number;
    weight?: "normal" | "bold";
} & RenderItemConfiguration

export function configureText(
    renderItem: TextConfiguration,
    context: CanvasRenderingContext2D,
) {
    let fontString = `${renderItem.size}px ${renderItem.font}`;
    //let alignOffset = 0;
    if (renderItem.weight) {
        fontString = renderItem.weight + " " + fontString;
    }

    context.fillStyle = renderItem.color;
    context.font = fontString;
    context.textBaseline = "top";
    /*     if (renderItem.align == "center" || renderItem.align == "right") {
        if (renderItem.width) {
            const textMetrics = context.measureText(renderItem.text);
            alignOffset = Math.max(0, renderItem.width - textMetrics.width) / 2;
        } else {
            console.warn("A width needs to be set for text to be aligned");
        }
    } */
}

export function textRenderer(
    renderItem: TextConfiguration,
    context: CanvasRenderingContext2D,
) {
    configureText(renderItem, context);
    context.fillText(
        renderItem.text,
        Math.floor(renderItem.x),
        Math.floor(renderItem.y),
    );
}
