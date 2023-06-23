import { sprites2 } from "../../asset/sprite.js";
import { allSides } from "../../common/sides.js";
export class OpenBookUIBackground {
    draw(context, screenPosition, size) {
        context.drawNinePatchSprite({
            sprite: sprites2.book_left,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 1,
            x: screenPosition.x,
            y: screenPosition.y
        });
        context.drawNinePatchSprite({
            sprite: sprites2.book_right,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 1,
            x: screenPosition.x + size.width / 2,
            y: screenPosition.y
        });
    }
}
