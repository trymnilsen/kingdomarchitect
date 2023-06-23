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
/**
 * BlinkingImageAnimation is a helperclass for rendering images that
 * should blink or switch between being visible or not visible
 */ export class BlinkingImageAnimation {
    /**
     * Update the position in the configuration with the newly provided point.
     * The configuration is updated in place.
     * @param position the position to use for future draw calls
     */ updatePosition(position) {
        this.sprite.x = position.x;
        this.sprite.y = position.y;
    }
    /**
     * Render the configation for this animation, taking into account
     * the amount of times this previously has been rendered to decided if
     * it should be shown or. Making the image look like it is blinking on and
     * off
     * @param context the context used for rendering
     */ onDraw(context) {
        if (this.frame % 2) {
            context.drawSprite(this.sprite);
        }
        this.frame = this.frame + 1;
    }
    /**
     * Create a new BlinkingImageAnimation
     * @param image The configratuion to render for this animation
     */ constructor(sprite){
        _define_property(this, "sprite", void 0);
        /**
     * The current frame number for this animation
     */ _define_property(this, "frame", void 0);
        this.sprite = sprite;
        this.frame = 0;
    }
}
