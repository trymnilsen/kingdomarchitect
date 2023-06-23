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
export class ColorBackground {
    draw(context, screenPosition, size) {
        context.drawScreenSpaceRectangle({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            fill: this.color
        });
    }
    constructor(color){
        _define_property(this, "color", void 0);
        this.color = color;
    }
}
export class NinePatchBackground {
    draw(context, screenPosition, size) {
        context.drawNinePatchSprite({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            sprite: this.sprite,
            scale: this.scale,
            sides: this.sides
        });
    }
    constructor(sprite, sides, scale){
        _define_property(this, "sprite", void 0);
        _define_property(this, "sides", void 0);
        _define_property(this, "scale", void 0);
        this.sprite = sprite;
        this.sides = sides;
        this.scale = scale;
    }
}
export class BoxBackground {
    draw(context, screenPosition, size) {
        context.drawScreenSpaceRectangle({
            x: screenPosition.x,
            y: screenPosition.y,
            width: size.width,
            height: size.height,
            fill: this.fill,
            strokeColor: this.stroke,
            strokeWidth: this.strokeWidth
        });
    }
    constructor(fill, stroke, strokeWidth){
        _define_property(this, "fill", void 0);
        _define_property(this, "stroke", void 0);
        _define_property(this, "strokeWidth", void 0);
        this.fill = fill;
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
    }
}
export class SpriteBackground {
    draw(context, screenPosition, size) {
        context.drawScreenSpaceSprite({
            sprite: this.sprite,
            x: screenPosition.x,
            y: screenPosition.y
        });
    }
    constructor(sprite){
        _define_property(this, "sprite", void 0);
        this.sprite = sprite;
    }
}
