function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../../../asset/sprite.js";
import { rgbToHex } from "../../../../../common/color.js";
import { TimeOfDay } from "../../../../../common/time.js";
import { UIView } from "../../../../../ui/uiView.js";
export class UITimeline extends UIView {
    hitTest(screenPoint) {
        return false;
    }
    layout(layoutContext, constraints) {
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
            height: 48
        };
        return this._measuredSize;
    }
    draw(context) {
        if (!this._measuredSize) {
            throw new Error("Size not measured");
        }
        const nextTimeOfDay = this.gameTime.nextTimeOfDay;
        for(let i = 0; i < 4; i++){
            const screenX = this.screenPosition.x + 48 * i + i * this.spaceBetweenWidth;
            if (i < 3) {
                context.drawScreenSpaceRectangle({
                    x: screenX + 48,
                    y: this.screenPosition.y + 16,
                    width: this.spaceBetweenWidth,
                    height: 16,
                    fill: timelineColor,
                    strokeColor: "black",
                    strokeWidth: 2
                });
            }
            context.drawScreenSpaceRectangle({
                x: screenX,
                y: this.screenPosition.y,
                width: 48,
                height: 48,
                fill: timelineColor,
                strokeColor: "black",
                strokeWidth: 2
            });
            if (i == 0) {
                const frame = Math.floor(this.gameTime.fractionalTimeOfDay * 4 % 1 * 8);
                context.drawScreenSpaceSprite({
                    x: this.screenPosition.x,
                    y: this.screenPosition.y,
                    sprite: sprites2.clock_reveal,
                    frame: frame,
                    targetHeight: 48,
                    targetWidth: 48
                });
            }
            const iconX = screenX + 8;
            const iconY = this.screenPosition.y + 8;
            const timeOfDay = nextTimeOfDay[i];
            switch(timeOfDay){
                case TimeOfDay.Dawn:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.sunrise_icon,
                        x: iconX,
                        y: iconY,
                        targetWidth: 32,
                        targetHeight: 32
                    });
                    break;
                case TimeOfDay.Day:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.sun_icon,
                        x: iconX,
                        y: iconY - 2,
                        targetWidth: 32,
                        targetHeight: 32
                    });
                    break;
                case TimeOfDay.Dusk:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.sunrise_icon,
                        x: iconX,
                        y: iconY,
                        targetWidth: 32,
                        targetHeight: 32
                    });
                    break;
                case TimeOfDay.Night:
                    context.drawScreenSpaceSprite({
                        sprite: sprites2.moon_icon,
                        x: iconX,
                        y: iconY - 2,
                        targetWidth: 32,
                        targetHeight: 32
                    });
                    break;
                default:
                    break;
            }
        }
    }
    constructor(gameTime, size){
        super(size);
        _define_property(this, "spaceBetweenWidth", wantedSpaceBetween);
        _define_property(this, "gameTime", void 0);
        this.gameTime = gameTime;
    }
}
const wantedSpaceBetween = 64;
const timelineColor = rgbToHex(0, 30, 10);
