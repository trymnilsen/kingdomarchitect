import { Sprite2 } from "../../../asset/sprite.js";
import { Point, zeroPoint } from "../../../common/point.js";
import { EcsComponent } from "../../../ecs/ecsComponent.js";

export class DrawableComponent extends EcsComponent {
    constructor(
        public sprite?: Sprite2,
        public offset: Point = zeroPoint(),
    ) {
        super();
    }
}
