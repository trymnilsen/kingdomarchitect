function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../../asset/sprite.js";
import { zeroPoint } from "../../../../common/point.js";
import { EntityComponent } from "../entityComponent.js";
export class SpriteComponent extends EntityComponent {
    updateSprite(sprite) {
        this.sprite = sprite;
    }
    onDraw(context, screenPosition) {
        let scale = 1;
        if (this.sprite == sprites2.mage || this.sprite == sprites2.bowman) {
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
            targetWidth: targetWidth
        });
    }
    constructor(sprite, offset = zeroPoint(), size){
        super();
        _define_property(this, "sprite", void 0);
        _define_property(this, "offset", void 0);
        _define_property(this, "size", void 0);
        this.sprite = sprite;
        this.offset = offset;
        this.size = size;
    }
}
