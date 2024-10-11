import { Sprite2, emptySprite, sprites2 } from "../../../asset/sprite.js";
import { Point, zeroPoint } from "../../../common/point.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { EntityComponent } from "../entityComponent.js";

export class SpriteComponent extends EntityComponent {
    private sprite: Sprite2 = emptySprite;
    private offset: Point = zeroPoint();
    private size?: Point;

    constructor(sprite: Sprite2, offset: Point, size?: Point) {
        super();
        this.sprite = sprite;
        this.offset = offset;
        this.size = size;
    }

    updateSprite(sprite: Sprite2) {
        this.sprite = sprite;
    }

    override onDraw(context: RenderScope, screenPosition: Point): void {
        const scale = 1;

        let targetWidth = this.size?.x;
        let targetHeight = this.size?.y;

        if (targetWidth) {
            targetWidth = targetWidth * scale;
        } else {
            targetWidth = context.measureSprite(this.sprite).width * scale;
        }

        if (targetHeight) {
            targetHeight = targetHeight * scale;
        } else {
            targetHeight = context.measureSprite(this.sprite).height * scale;
        }

        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenPosition.x + this.offset.x,
            y: screenPosition.y + this.offset.y,
            targetHeight: targetHeight,
            targetWidth: targetWidth,
        });
    }
}
