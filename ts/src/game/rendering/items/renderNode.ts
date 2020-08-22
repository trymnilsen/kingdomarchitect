import { RenderContext } from "../renderContext";
import { Point, addPoint } from "../../../data/point";
import { Camera } from "../camera";
import { RenderItem } from "../renderer";

export interface NodeConfiguration {
    x: number;
    y: number;
    depth?: number;
    includeInHitList?: boolean;
}

export enum RenderNodeType {
    container = "CONTAINER",
    rectangle = "RECTANGLE",
    text = "TEXT",
}

export interface RenderNode {
    type: RenderNodeType;
    config: NodeConfiguration;
    children: RenderNode[];
}

export function container(point?: Point): RenderNode {
    if (!point) {
        point = { x: 0, y: 0 };
    }
    return {
        type: RenderNodeType.container,
        config: {
            x: point.x,
            y: point.y,
        },
        children: [],
    };
}

/* export class RenderNode {
    public position: Point;
    public depth: number = 0;
    protected _absolutePosition: Point;
    protected _children: RenderNode[] = [];
    protected _screenSpacePosition: Point;
    public constructor(nodeConfig?: NodeConfiguration) {
        this.position = { x: 0, y: 0 };
        if (!!nodeConfig) {
            this.position = { x: nodeConfig.x, y: nodeConfig.y };
            if (!!nodeConfig.depth) {
                this.depth = nodeConfig.depth;
            }
        }
    }
    public render(context: CanvasRenderingContext2D): void {}
    public addChild(child: RenderNode) {
        if (child == this) {
            throw new Error("Cannot add self");
        }
        this._children.push(child);
    }
    public get children(): Readonly<RenderNode[]> {
        return this._children;
    }
    public get absolutePosition(): Readonly<Point> {
        return this._absolutePosition;
    }
    public updateTransform(parentPoint: Point, cameraScreenSpace: Point) {
        if (!parentPoint) {
            //No parent, use zero
            parentPoint = { x: 0, y: 0 };
        }
        this._screenSpacePosition = cameraScreenSpace;
        this._absolutePosition = addPoint(parentPoint, this.position);
        this.children.forEach((p) =>
            p.updateTransform(this._absolutePosition, cameraScreenSpace)
        );
    }
}

export class UiRenderNode extends RenderNode {
    public updateTransform(parentPoint: Point, cameraScreenSpace: Point) {
        //Ui nodes are never moved based on camera
        if (!parentPoint) {
            //No parent, use zero
            parentPoint = { x: 0, y: 0 };
        }
        this._absolutePosition = addPoint(parentPoint, this.position);
        this.children.forEach((p) =>
            p.updateTransform(this._absolutePosition, { x: 0, y: 0 })
        );
    }
}
 */
