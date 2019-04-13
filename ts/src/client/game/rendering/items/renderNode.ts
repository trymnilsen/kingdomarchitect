import { RenderContext } from "../renderContext";
import { Point, addPoint } from "../../../../common/data/point";

export interface NodeConfiguration {
    x: number;
    y: number;
    depth?: number;
}

export class RenderNode {
    public position: Point;
    public depth: number;
    private _absolutePosition: Point;
    private _children: RenderNode[] = [];
    public constructor(nodeConfig?: NodeConfiguration) {
        this.position = { x: 0, y: 0 };
        if (!!nodeConfig) {
            this.position = { x: nodeConfig.x, y: nodeConfig.y };
            this.depth = nodeConfig.depth;
        }
    }
    public render(context: CanvasRenderingContext2D): void {}
    public addChild(child: RenderNode) {
        this._children.push(child);
    }
    public get children(): Readonly<RenderNode[]> {
        return this._children;
    }
    public get absolutePosition(): Readonly<Point> {
        return this._absolutePosition;
    }
    public updateTransform(parentPoint: Point) {
        if (!parentPoint) {
            //No parent, use zero
            parentPoint = { x: 0, y: 0 };
        }
        this._absolutePosition = addPoint(parentPoint, this.position);
        this.children.forEach((p) => p.updateTransform(this._absolutePosition));
    }
}
