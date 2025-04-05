import { sprites2 } from "../../../../module/asset/sprite.js";
import { Point } from "../../../../common/point.js";
import { RenderScope } from "../../../../rendering/renderScope.js";
import { biomes } from "../../../../module/map/biome.js";
import { InteractionState } from "../../handler/interactionState.js";

export class ScrollInteractionState extends InteractionState {
    override onDraw(context: RenderScope): void {
        const bottomY = this.context.camera.windowSize.y - 200;
        const cards = 3;
        const middleX =
            Math.floor(this.context.camera.windowSize.x / 2) - (80 * cards) / 2;

        for (let i = 0; i < cards; i++) {
            drawCard(context, { x: middleX + i * 80, y: bottomY });
        }
        /*
        context.drawIntoSprite(
            "card",
            { width: 96, height: 80 },
            (scope) => {},
        );*/
    }
}

function drawCard(context: RenderScope, origin: Point) {
    context.drawScreenSpaceRectangle({
        width: 80,
        height: 90,
        fill: biomes.forrest.color,
        x: origin.x,
        y: origin.y + 3,
    });
    context.drawScreenSpaceSprite({
        sprite: sprites2.paladin,
        x: origin.x + 16,
        y: origin.y - 4,
        targetWidth: 64,
        targetHeight: 64,
    });
    context.drawScreenSpaceSprite({
        sprite: sprites2.card,
        x: origin.x,
        y: origin.y,
        targetHeight: 96,
        targetWidth: 80,
    });
}
