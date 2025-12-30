import { sprites2 } from "../../asset/sprite.ts";
import { Point } from "../../common/point.ts";
import { allSides } from "../../common/sides.ts";
import { UIRenderScope } from "../../rendering/uiRenderContext.ts";
import { UIBackground } from "../uiBackground.ts";
import { UISize } from "../uiSize.ts";

export class OpenBookUIBackground implements UIBackground {
    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void {
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
