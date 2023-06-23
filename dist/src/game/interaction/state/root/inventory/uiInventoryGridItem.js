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
import { allSides } from "../../../../../common/sides.js";
import { UIThemeType } from "../../../../../ui/color.js";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl.js";
import { fillUiSize } from "../../../../../ui/uiSize.js";
import { UIButton } from "../../../../../ui/view/uiButton.js";
export class UIInventoryGridItem extends UIButton {
    layout(layoutContext, constraints) {
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height
        };
        return this._measuredSize;
    }
    draw(context) {
        super.draw(context);
        const size = this._measuredSize;
        if (!size) {
            throw new Error("Measured size not set");
        }
        context.drawScreenSpaceSprite({
            x: this.screenPosition.x + 4,
            y: this.screenPosition.y + 4,
            sprite: this.sprite
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
        }*/ }
    /**
     * return either book item grid or book item grid gray
     * depending on the theme
     * @param theme
     * @returns
     */ static getBackgroundSprite(theme) {
        return theme === UIThemeType.Book ? sprites2.book_grid_item : sprites2.book_grid_item_gray;
    }
    /**
     * Same as getBackgroundSprite but for the focused state
     */ static getFocusedBackgroundSprite(theme) {
        return theme === UIThemeType.Book ? sprites2.book_grid_item_focused : sprites2.book_grid_item_gray_focused;
    }
    constructor(sprite, isSelected, theme){
        super({
            width: fillUiSize,
            height: fillUiSize
        });
        _define_property(this, "sprite", void 0);
        _define_property(this, "isSelected", void 0);
        _define_property(this, "theme", void 0);
        this.sprite = sprite;
        this.isSelected = isSelected;
        this.theme = theme;
        this.defaultBackground = ninePatchBackground({
            sprite: UIInventoryGridItem.getBackgroundSprite(theme),
            sides: allSides(8),
            scale: 1
        });
        this.onTappedBackground = ninePatchBackground({
            sprite: UIInventoryGridItem.getFocusedBackgroundSprite(theme),
            sides: allSides(8),
            scale: 1
        });
    }
}
