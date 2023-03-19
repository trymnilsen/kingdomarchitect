import { sprites2 } from "../../../../../asset/sprite";
import { rgbToHex } from "../../../../../common/color";
import { Point } from "../../../../../common/point";
import { GameTime, TimeOfDay } from "../../../../../common/time";
import { UIRenderContext } from "../../../../../rendering/uiRenderContext";
import { UILayoutContext } from "../../../../../ui/uiLayoutContext";
import { UISize } from "../../../../../ui/uiSize";
import { UIView } from "../../../../../ui/uiView";

export class UITimeline extends UIView {
    private spaceBetweenWidth: number = wantedSpaceBetween;
    private gameTime: GameTime;
    constructor(gameTime: GameTime, size: UISize) {
        super(size);
        this.gameTime = gameTime;
    }

    hitTest(screenPoint: Point): boolean {
        return false;
    }

    layout(layoutContext: UILayoutContext, constraints: UISize): UISize {
        const rectangleSizes = 48 * 4;
        const wantedWidth = rectangleSizes + this.spaceBetweenWidth * 3;
        if (constraints.width < wantedWidth) {
            const remainingWidth = constraints.width - rectangleSizes;
            this.spaceBetweenWidth = remainingWidth / 3;
        }

        //Re-calculate the width based on the potentially updated spacebetween
        const measuredWidth = rectangleSizes + this.spaceBetweenWidth * 3;
        this._measuredSize = {
            width: measuredWidth,
            height: 48,
        };

        return this._measuredSize;
    }

    draw(context: UIRenderContext): void {
        if (!this._measuredSize) {
            throw new Error("Size not measured");
        }

        const nextTimeOfDay = this.gameTime.nextTimeOfDay;

        for (let i = 0; i < 4; i++) {
            const screenX =
                this.screenPosition.x + 48 * i + i * this.spaceBetweenWidth;

            if (i < 3) {
                context.drawScreenSpaceRectangle({
                    x: screenX + 48,
                    y: this.screenPosition.y + 16,
                    width: this.spaceBetweenWidth,
                    height: 16,
                    fill: timelineColor,
                    strokeColor: "black",
                    strokeWidth: 2,
                });
            }

            context.drawScreenSpaceRectangle({
                x: screenX,
                y: this.screenPosition.y,
                width: 48,
                height: 48,
                fill: timelineColor,
                strokeColor: "black",
                strokeWidth: 2,
            });

            if (i == 0) {
                const frame = Math.floor(
                    ((this.gameTime.fractionalTimeOfDay * 4) % 1) * 8
                );
                context.drawScreenSpaceSprite({
                    x: this.screenPosition.x,
                    y: this.screenPosition.y,
                    sprite: sprites2.clock_reveal,
                    frame: frame,
                    targetHeight: 48,
                    targetWidth: 48,
                });
            }

            const iconX = screenX + 8;
            const iconY = this.screenPosition.y + 8;
            const timeOfDay = nextTimeOfDay[i];
            switch (timeOfDay) {
                case TimeOfDay.Dawn:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.sunrise_icon,
                        x: iconX,
                        y: iconY,
                        targetWidth: 32,
                        targetHeight: 32,
                    });
                    break;
                case TimeOfDay.Day:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.sun_icon,
                        x: iconX,
                        y: iconY - 2,
                        targetWidth: 32,
                        targetHeight: 32,
                    });
                    break;
                case TimeOfDay.Dusk:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.sunrise_icon,
                        x: iconX,
                        y: iconY,
                        targetWidth: 32,
                        targetHeight: 32,
                    });
                    break;
                case TimeOfDay.Night:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.moon_icon,
                        x: iconX,
                        y: iconY - 2,
                        targetWidth: 32,
                        targetHeight: 32,
                    });
                    break;
                default:
                    break;
            }
        }
    }
}

const wantedSpaceBetween = 64;
const timelineColor = rgbToHex(0, 30, 10);
