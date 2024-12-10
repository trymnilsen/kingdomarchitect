import { Sprite2 } from "../../../asset/sprite.js";
import { Point, zeroPoint } from "../../../common/point.js";

export class DrawableComponent {
    constructor(
        public sprite?: Sprite2,
        public offset: Point = zeroPoint(),
    ) {}
}
