import { sprites2 } from "../../asset/sprite.js";
import { Point } from "../../common/point.js";
import { allSides } from "../../common/sides.js";
import { UIRenderContext } from "../../rendering/uiRenderContext.js";
import { UIBackground } from "../uiBackground.js";
import { UISize } from "../uiSize.js";

export class OpenBookUIBackground implements UIBackground {
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawNinePatchSprite({
            sprite: sprites2.book_left,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 2,
            x: screenPosition.x,
            y: screenPosition.y,
        });
        context.drawNinePatchSprite({
            sprite: sprites2.book_right,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 2,
            x: screenPosition.x + size.width / 2,
            y: screenPosition.y,
        });
    }
}
