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
export class UISpriteImageSource {
    measure(layoutContext) {
        return layoutContext.measureSprite(this.sprite);
    }
    draw(context, screenposition, size) {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenposition.x,
            y: screenposition.y,
            targetWidth: size.width,
            targetHeight: size.height
        });
    }
    constructor(sprite){
        _define_property(this, "sprite", void 0);
        this.sprite = sprite;
    }
}
