import { Sprite2 } from "../../asset/sprite.js";
import { addPoint, Point, zeroPoint } from "../../common/point.js";
import { RenderScope } from "../renderScope.js";

export class SpriteAnimation {
    private currentFrame = 0;
    private position: Point = zeroPoint();
    private spriteFrames: Sprite2[];

    constructor(spriteFrames: Sprite2[]) {
        this.spriteFrames = spriteFrames;
    }

    updatePosition(point: Point) {
        this.position = point;
    }

    onDraw(context: RenderScope) {
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
