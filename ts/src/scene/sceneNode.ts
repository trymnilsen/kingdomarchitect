import { addPoint, Point, zeroPoint } from "../common/point";
import { RenderContext } from "../rendering/renderContext";

export abstract class SceneNode {
    private localPosition: Point;
    private worldPosition: Point;

    constructor() {
        this.localPosition = zeroPoint;
        this.worldPosition = zeroPoint;
    }

    public get position(): Point {
        return this.worldPosition;
    }

    public updateTransform(parentPosition: Point) {
        this.worldPosition = addPoint(parentPosition, this.localPosition);
    }

    public abstract draw(context: RenderContext): void;
}
