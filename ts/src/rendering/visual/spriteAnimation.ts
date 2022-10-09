import { Sprite } from "../../asset/sprite";
import { addPoint, Point, zeroPoint } from "../../common/point";
import { RenderContext } from "../renderContext";

export class SpriteAnimation {
    private currentFrame: number = 0;
    private position: Point = zeroPoint();
    constructor(private spriteFrames: Sprite[]) {}

    updatePosition(point: Point) {
        this.position = point;
    }

    onDraw(context: RenderContext) {
        const worldspacePosition = addPoint(
            context.camera.tileSpaceToWorldSpace(this.position),
            {
                x: 10,
                y: 10,
            }
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
