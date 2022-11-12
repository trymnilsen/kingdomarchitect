import { InvalidStateError } from "../../common/error/invalidStateError";
import { Point, zeroPoint } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { World } from "../world";

export abstract class Entity {
    private _world: World | null = null;

    tilePosition: Point = zeroPoint();

    get world(): World {
        if (!this._world) {
            throw new InvalidStateError(
                "World not set, perhaps it is not added to the world yet?"
            );
        }
        return this._world;
    }

    set world(value: World) {
        this._world = value;
    }

    onDraw(context: RenderContext) {}
    /*     x: number;
    y: number;
    weight?: number;
    offset?: Point;
    visual?: RenderVisual;
    sprite?: keyof typeof sprites; */
}
