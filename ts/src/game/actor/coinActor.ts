import { sprites } from "../../asset/sprite";
import { Point } from "../../common/point";
import { RenderContext } from "../../rendering/renderContext";
import { SpriteAnimation } from "../../rendering/visual/spriteAnimation";
import { Actor } from "./actor";

export class CoinActor extends Actor {
    private coinAnimation: SpriteAnimation;
    constructor(initialPoint: Point) {
        super(initialPoint, sprites.coins);
        this.coinAnimation = new SpriteAnimation([
            sprites.coins,
            sprites.coinsFlat,
        ]);
        this.coinAnimation.updatePosition(initialPoint);
    }

    onDraw(context: RenderContext) {
        this.coinAnimation.onDraw(context);
    }
}
