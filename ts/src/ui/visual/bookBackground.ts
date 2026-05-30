import { spriteRefs } from "../../asset/sprite.ts";
import { type Point } from "../../common/point.ts";
import { allSides } from "../../common/sides.ts";
import { type UIRenderScope } from "../../rendering/uiRenderContext.ts";
import { type UIBackground } from "../uiBackground.ts";
import { type UISize } from "../uiSize.ts";

export const OpenBookPage = {
    Left: 0,
    Right: 1,
    Both: 2,
} as const;

export type OpenBookPage = (typeof OpenBookPage)[keyof typeof OpenBookPage];

/**
 * Draws the open-book panel. With {@link OpenBookPage.Both} it fills the box
 * with the left and right page halves side by side. With a single page it fills
 * the whole box with just that page's ninepatch, which is what a narrow,
 * single-page layout shows.
 */
export class OpenBookUIBackground implements UIBackground {
    private page: OpenBookPage;

    constructor(page: OpenBookPage = OpenBookPage.Both) {
        this.page = page;
    }

    draw(context: UIRenderScope, screenPosition: Point, size: UISize): void {
        if (this.page === OpenBookPage.Left) {
            context.drawNinePatchSprite({
                sprite: spriteRefs.book_left,
                sides: allSides(32),
                height: size.height,
                width: size.width,
                scale: 2,
                x: screenPosition.x,
                y: screenPosition.y,
            });
            return;
        }

        if (this.page === OpenBookPage.Right) {
            context.drawNinePatchSprite({
                sprite: spriteRefs.book_right,
                sides: allSides(32),
                height: size.height,
                width: size.width,
                scale: 2,
                x: screenPosition.x,
                y: screenPosition.y,
            });
            return;
        }

        context.drawNinePatchSprite({
            sprite: spriteRefs.book_left,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 2,
            x: screenPosition.x,
            y: screenPosition.y,
        });
        context.drawNinePatchSprite({
            sprite: spriteRefs.book_right,
            sides: allSides(32),
            height: size.height,
            width: size.width / 2,
            scale: 2,
            x: screenPosition.x + size.width / 2,
            y: screenPosition.y,
        });
    }
}
