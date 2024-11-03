import { DrawMode } from "../../../../rendering/drawMode.js";
import { Entity } from "../../../entity/entity.js";
import { SpriteProvider, SpriteProviderConfig } from "./spriteProvider.js";

export class SpriteStateMachine implements SpriteProvider {
    onUpdate(updateTick: number, entity: Entity): void {
        throw new Error("Method not implemented.");
    }
    onDraw(
        drawTick: number,
        entity: Entity,
        drawMode: DrawMode,
    ): SpriteProviderConfig {
        throw new Error("Method not implemented.");
    }
}
