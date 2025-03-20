import {
    Sprite2,
    emptySprite,
    sprites2,
} from "../../../module/asset/sprite.js";
import { Point, zeroPoint } from "../../../common/point.js";
import { DrawMode } from "../../../rendering/drawMode.js";
import { RenderScope } from "../../../rendering/renderScope.js";
import { RenderVisibilityMap } from "../../../rendering/renderVisibilityMap.js";
import { EntityComponent } from "../entityComponent.js";
import { SpriteProviderConfig } from "./spriteProvider/spriteProvider.js";
import { SpriteStateMachine } from "./spriteProvider/statemachine/spriteStateMachine.js";
import { SpriteTint } from "./spriteTint.js";

export class SpriteComponent extends EntityComponent {
    private sprite: Sprite2 = emptySprite;
    private offset: Point = zeroPoint();
    private size?: Point;
    private _tint: SpriteTint | null = null;

    /**
     * Retrieve the currently set tint on the sprite. Can be null if none is set
     */
    public get tint(): Readonly<SpriteTint> | null {
        return this._tint;
    }

    /**
     * Set the tint for the sprite component, see [SpriteTint] for the different
     * options that can be set as well as helper methods for creating tints
     */
    public set tint(v: SpriteTint | null) {
        console.log("Setting sprite tint", v);
        this._tint = v;
    }

    constructor(sprite: Sprite2, offset: Point, size?: Point) {
        super();
        this.sprite = sprite;
        this.offset = offset;
        this.size = size;
    }

    updateSprite(sprite: Sprite2) {
        this.sprite = sprite;
    }

    override onDraw(
        context: RenderScope,
        screenPosition: Point,
        _visibilityMap: RenderVisibilityMap,
        drawMode: DrawMode,
    ): void {
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

        if (drawMode == DrawMode.Tick && !!this._tint) {
            // if there are no frames left, clear it
            if (this._tint.frames == 0) {
                console.log("Resetting sprite tint");
                this._tint = null;
            } else if (this._tint.frames > 0) {
                console.log("Subtracting sprite tint");
                this._tint.frames -= 1;
            }
        }

        let spriteConfig: SpriteProviderConfig | null = null;
        let frame = 0;
        const component = this.entity.getComponent(SpriteStateMachine);
        if (component) {
            spriteConfig = component.updateSpriteConfiguration(
                context.drawTick,
                drawMode,
            );
            frame = spriteConfig.frame;
        }

        context.drawScreenSpaceSprite({
            frame: frame,
            sprite: spriteConfig?.sprite ?? this.sprite,
            x: screenPosition.x + this.offset.x,
            y: screenPosition.y + this.offset.y,
            targetHeight: targetHeight,
            targetWidth: targetWidth,
            tint: this._tint?.color,
        });
    }
}
