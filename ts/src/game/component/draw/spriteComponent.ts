import { Sprite2, sprites2 } from "../../../asset/sprite.js";
import { Point, zeroPoint } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { ComponentFactory, EntityComponent } from "../entityComponent.js";

type SpriteComponentBundle = {
    sprite: Sprite2;
    offset: Point;
    size: Point;
};

export class SpriteComponent extends EntityComponent<SpriteComponentBundle> {
    constructor(
        private sprite: Sprite2,
        private offset: Point = zeroPoint(),
        private size?: Point
    ) {
        super();
    }

    updateSprite(sprite: Sprite2) {
        this.sprite = sprite;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
        let scale = 1;
        if (
            this.sprite == sprites2.mage ||
            this.sprite == sprites2.bowman ||
            this.sprite == sprites2.dweller
        ) {
            scale = 2;
        }

        let targetWidth = this.size?.x;
        let targetHeight = this.size?.y;

        if (!!targetWidth) {
            targetWidth = targetWidth * scale;
        } else {
            targetWidth = context.measureSprite(this.sprite).width * scale;
        }

        if (!!targetHeight) {
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
