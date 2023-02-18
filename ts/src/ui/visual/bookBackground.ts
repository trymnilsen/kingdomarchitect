import { sprites2 } from "../../asset/sprite";
import { Point } from "../../common/point";
import { allSides } from "../../common/sides";
import { UIRenderContext } from "../../rendering/uiRenderContext";
import { UIBackground } from "../uiBackground";
import { UISize } from "../uiSize";

export class OpenBookUIBackground implements UIBackground {
    draw(context: UIRenderContext, screenPosition: Point, size: UISize): void {
        context.drawNinePatchSprite({
            sprite: sprites2.book_left,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 1,
            x: screenPosition.x,
            y: screenPosition.y,
        });
        context.drawNinePatchSprite({
            sprite: sprites2.book_right,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 1,
            x: screenPosition.x + size.width / 2,
            y: screenPosition.y,
        });
    }
}
