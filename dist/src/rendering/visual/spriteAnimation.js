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
import { addPoint, zeroPoint } from "../../common/point.js";
export class SpriteAnimation {
    updatePosition(point) {
        this.position = point;
    }
    onDraw(context) {
        const worldspacePosition = addPoint(context.camera.tileSpaceToWorldSpace(this.position), {
            x: 10,
            y: 10
        });
        const frameIndex = this.currentFrame % this.spriteFrames.length;
        const spriteFrame = this.spriteFrames[frameIndex];
        context.drawSprite({
            sprite: spriteFrame,
            ...worldspacePosition
        });
        this.currentFrame += 1;
    }
    constructor(spriteFrames){
        _define_property(this, "spriteFrames", void 0);
        _define_property(this, "currentFrame", void 0);
        _define_property(this, "position", void 0);
        this.spriteFrames = spriteFrames;
        this.currentFrame = 0;
        this.position = zeroPoint();
    }
}
