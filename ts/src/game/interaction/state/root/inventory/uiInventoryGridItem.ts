import { Sprite2, sprites2 } from "../../../../../module/asset/sprite.js";
import { allSides } from "../../../../../common/sides.js";
import { UIRenderScope } from "../../../../../rendering/uiRenderContext.js";
import { UIThemeType } from "../../../../../ui/color.js";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl.js";
import { UILayoutScope } from "../../../../../ui/uiLayoutContext.js";
import { fillUiSize, UISize } from "../../../../../ui/uiSize.js";
import { UIButton } from "../../../../../ui/view/uiButton.js";

export class UIInventoryGridItem extends UIButton {
    constructor(
        private sprite: Sprite2,
        public isSelected: boolean,
        private theme: UIThemeType,
    ) {
        super({
            width: fillUiSize,
            height: fillUiSize,
        });

        this.defaultBackground = ninePatchBackground({
            sprite: UIInventoryGridItem.getBackgroundSprite(theme),
            sides: allSides(8),
            scale: 1,
        });

        this.onTappedBackground = ninePatchBackground({
            sprite: UIInventoryGridItem.getFocusedBackgroundSprite(theme),
            sides: allSides(8),
            scale: 1,
        });
    }

    override layout(
        _layoutContext: UILayoutScope,
        constraints: UISize,
    ): UISize {
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height,
        };
        return this._measuredSize;
    }

    override draw(context: UIRenderScope): void {
        super.draw(context);
        const size = this._measuredSize;

        if (!size) {
            throw new Error("Measured size not set");
        }

        context.drawScreenSpaceSprite({
            x: this.screenPosition.x + 4,
            y: this.screenPosition.y + 4,
            targetWidth: 32,
            targetHeight: 32,
            sprite: this.sprite,
        });

        /*
        if (this.isSelected) {
            context.drawNinePatchSprite({
                x: this.screenPosition.x - 4,
                y: this.screenPosition.y - 4,
                width: size.width + 8,
                height: size.height + 8,
                scale: 1,
                sprite: sprites2.cursor,
                sides: allSides(12),
            });
        }*/
    }

    /**
     * return either book item grid or book item grid gray
     * depending on the theme
     * @param theme
     * @returns
     */
    static getBackgroundSprite(theme: UIThemeType): Sprite2 {
        return theme === UIThemeType.Book
            ? sprites2.book_grid_item
            : sprites2.book_grid_item_gray;
    }

    /**
     * Same as getBackgroundSprite but for the focused state
     */
    static getFocusedBackgroundSprite(theme: UIThemeType): Sprite2 {
        return theme === UIThemeType.Book
            ? sprites2.book_grid_item_focused
            : sprites2.book_grid_item_gray_focused;
    }
}
