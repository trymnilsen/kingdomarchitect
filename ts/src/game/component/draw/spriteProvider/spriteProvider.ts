import { Sprite2 } from "../../../../module/asset/sprite.js";
import { Point } from "../../../../common/point.js";
import { DrawMode } from "../../../../rendering/drawMode.js";
import { Entity } from "../../../entity/entity.js";

export type SpriteProviderConfig = {
    sprite: Sprite2;
    offset: Point;
    frame: number;
};
export interface SpriteProvider {
    onUpdate(updateTick: number, entity: Entity): void;
    onDraw(
        drawTick: number,
        entity: Entity,
        drawMode: DrawMode,
    ): SpriteProviderConfig;
}
