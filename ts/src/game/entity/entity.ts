import { Point, zeroPoint } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";

export abstract class Entity {
    tilePosition: Point = zeroPoint();

    onDraw(context: RenderContext) {}
    /*     x: number;
    y: number;
    weight?: number;
    offset?: Point;
    visual?: RenderVisual;
    sprite?: keyof typeof sprites; */
}
