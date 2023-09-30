import { Sprite2, emptySprite, sprites2 } from "../../../asset/sprite.js";
import { Point, zeroPoint } from "../../../common/point.js";
import { RenderContext } from "../../../rendering/renderContext.js";
import { EntityComponent } from "../entityComponent.js";

type SpriteComponentBundle = {
    sprite: string;
    offset: Point;
    size?: Point;
};

export class SpriteComponent extends EntityComponent<SpriteComponentBundle> {
    private sprite: Sprite2 = emptySprite;
    private offset: Point = zeroPoint();
    private size?: Point;

    static createInstance(
        sprite: Sprite2,
        offset: Point,
        size?: Point
    ): SpriteComponent {
        const instance = new SpriteComponent();
        instance.fromComponentBundle({
            offset: offset,
            sprite: sprite.id,
            size: size,
        });
        return instance;
    }

    updateSprite(sprite: Sprite2) {
        this.sprite = sprite;
    }

    override onDraw(context: RenderContext, screenPosition: Point): void {
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

    override fromComponentBundle(bundle: SpriteComponentBundle): void {
        const sprite = sprites2[bundle.sprite];
        if (!sprite) {
            throw new Error(`No sprite with id ${bundle.sprite}`);
        }

        this.sprite = sprite;
        this.offset = bundle.offset;
        this.size = bundle.size;
    }

    override toComponentBundle(): SpriteComponentBundle {
        return {
            sprite: this.sprite.id,
            offset: this.offset,
            size: this.size,
        };
    }
}
