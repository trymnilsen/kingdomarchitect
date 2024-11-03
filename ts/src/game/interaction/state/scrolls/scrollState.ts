import { sprites2 } from "../../../../asset/sprite.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { biomes } from "../../../map/biome/biome.js";
import { InteractionState } from "../../handler/interactionState.js";

export class ScrollInteractionState extends InteractionState {
    override onDraw(context: RenderScope): void {
        const bottomY = this.context.camera.windowSize.y - 200;
        const middleX = Math.floor(this.context.camera.windowSize.x / 2);
        /*
        context.drawIntoSprite(
            "card",
            { width: 96, height: 80 },
            (scope) => {},
        );*/
        context.drawScreenSpaceRectangle({
            width: 80,
            height: 90,
            fill: biomes.forrest.color,
            x: middleX,
            y: bottomY + 3,
        });
        context.drawScreenSpaceSprite({
            sprite: sprites2.paladin,
            x: middleX + 16,
            y: bottomY - 4,
            targetWidth: 64,
            targetHeight: 64,
        });
        context.drawScreenSpaceSprite({
            sprite: sprites2.card,
            x: middleX,
            y: bottomY,
            targetHeight: 96,
            targetWidth: 80,
        });
    }
}
