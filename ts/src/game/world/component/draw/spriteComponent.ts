import { Sprite2 } from "../../../../asset/sprite";
import { Point, zeroPoint } from "../../../../common/point";
import { RenderContext } from "../../../../rendering/renderContext";
import { EntityComponent } from "../entityComponent";

export class SpriteComponent extends EntityComponent {
    constructor(
        private sprite: Sprite2,
        private offset: Point = zeroPoint(),
        private size?: Point
    ) {
        super();
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenPosition.x + this.offset.x,
            y: screenPosition.y + this.offset.y,
            targetHeight: this.size?.y,
            targetWidth: this.size?.x,
        });
    }
}
