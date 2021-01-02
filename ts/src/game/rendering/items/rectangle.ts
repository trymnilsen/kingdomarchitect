import { RenderNode, NodeConfiguration, RenderNodeType } from "./renderNode";
import { RenderContext } from "../renderContext";
import { RenderItem } from "../renderer";
import { Point } from "../../../data/point";

export interface RectangleConfiguration extends NodeConfiguration {
    width: number;
    height: number;
    fill?: string;
    strokeWidth?: number;
    strokeColor?: string;
}

export function rectangle(config: RectangleConfiguration): RenderNode {
    if (!config.fill && !config.strokeWidth) {
        throw new Error("fill or strokeWidth needs to be set");
    }
    return {
        type: RenderNodeType.rectangle,
        config: config,
        children: [],
    };
}

export function rectangleRenderer(
    renderItem: RenderItem,
    context: CanvasRenderingContext2D
) {
    const config = renderItem.node.config as RectangleConfiguration;

    if (!!config.fill) {
        context.fillStyle = config.fill;
        context.fillRect(
            renderItem.transform.x,
            renderItem.transform.y,
            config.width,
            config.height
        );
    }

    if (config.strokeWidth > 0) {
        const color = config.strokeColor || "black";
        context.lineWidth = config.strokeWidth;
        context.strokeStyle = color;
        context.strokeRect(
            renderItem.transform.x,
            renderItem.transform.y,
            config.width,
            config.height
        );
    }
}

export function testRectangleHit(
    testPoint: Point,
    rectanglePoint: Point,
    rectangleConfig: RectangleConfiguration
): boolean {
    const x1 = rectanglePoint.x;
    const y1 = rectanglePoint.y;
    const x2 = rectanglePoint.x + rectangleConfig.width;
    const y2 = rectanglePoint.y + rectangleConfig.height;
    return (
        x1 <= testPoint.x &&
        x2 >= testPoint.x &&
        y1 <= testPoint.y &&
        y2 >= testPoint.y
    );
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
