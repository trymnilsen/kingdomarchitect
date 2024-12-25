import { Sprite2 } from "../../../asset/sprite.js";
import { Bounds } from "../../../common/bounds.js";
import { Point, zeroPoint } from "../../../common/point.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";

export type Drawable = SpriteDrawable | ShapeDrawable;
export type SpriteDrawable = {
    sprite: Sprite2;
};

export type ShapeDrawable = {
    color: string;
    size: Point;
};

export class DrawableComponent extends EcsComponent {
    constructor(
        public drawable: Drawable,
        public offset: Point = zeroPoint(),
    ) {
        super();
    }
}
