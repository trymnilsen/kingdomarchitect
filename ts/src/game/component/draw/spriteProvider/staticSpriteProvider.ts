import { Sprite2 } from "../../../../asset/sprite.js";
import { zeroPoint } from "../../../../common/point.js";
import { DrawMode } from "../../../../rendering/drawMode.js";
import { Entity } from "../../../entity/entity.js";
import { SpriteProvider, SpriteProviderConfig } from "./spriteProvider.js";

export class StaticSpriteProvider implements SpriteProvider {
    private spriteConfig: SpriteProviderConfig;
    constructor(sprite: Sprite2) {
        this.spriteConfig = {
            offset: zeroPoint(),
            sprite: sprite,
        };
    }
    onUpdate(_updateTick: number, _entity: Entity): void {}
    onDraw(
        _drawTick: number,
        _entity: Entity,
        _drawMode: DrawMode,
    ): SpriteProviderConfig {
        return this.spriteConfig;
    }
}
