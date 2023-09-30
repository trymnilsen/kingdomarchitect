import { Sprite2 } from "../../asset/sprite.js";
import { addPoint, Point, zeroPoint } from "../../common/point.js";
import { RenderContext } from "../renderContext.js";

export class SpriteAnimation {
    private currentFrame: number = 0;
    private position: Point = zeroPoint();
    constructor(private spriteFrames: Sprite2[]) {}

    updatePosition(point: Point) {
        this.position = point;
    }

    onDraw(context: RenderContext) {
        const worldspacePosition = addPoint(
            context.camera.tileSpaceToWorldSpace(this.position),
            {
                x: 10,
                y: 10,
            },
        );
        const frameIndex = this.currentFrame % this.spriteFrames.length;
        const spriteFrame = this.spriteFrames[frameIndex];
        context.drawSprite({
            sprite: spriteFrame,
            ...worldspacePosition,
        });
        this.currentFrame += 1;
    }
}
