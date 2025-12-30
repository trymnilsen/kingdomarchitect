import { Point } from "../../common/point.js";
import { SpriteConfiguration } from "../items/sprite.js";
import { RenderScope } from "../renderScope.js";

/**
 * BlinkingImageAnimation is a helperclass for rendering images that
 * should blink or switch between being visible or not visible
 */
export class BlinkingImageAnimation {
    /**
     * The current frame number for this animation
     */
    private frame = 0;
    private sprite: SpriteConfiguration;

    /**
     * Create a new BlinkingImageAnimation
     * @param image The configratuion to render for this animation
     */
    constructor(sprite: SpriteConfiguration) {
        this.sprite = sprite;
    }

    /**
     * Update the position in the configuration with the newly provided point.
     * The configuration is updated in place.
     * @param position the position to use for future draw calls
     */
    updatePosition(position: Point) {
        this.sprite.x = position.x;
        this.sprite.y = position.y;
    }

    /**
     * Render the configation for this animation, taking into account
     * the amount of times this previously has been rendered to decided if
     * it should be shown or. Making the image look like it is blinking on and
     * off
     * @param context the context used for rendering
     */
    onDraw(context: RenderScope) {
        if (this.frame % 2) {
            context.drawSprite(this.sprite);
        }
        this.frame = this.frame + 1;
    }
}
