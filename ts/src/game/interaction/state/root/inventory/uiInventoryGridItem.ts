import { Sprite2, sprites2 } from "../../../../../asset/sprite";
import { allSides } from "../../../../../common/sides";
import { UIRenderContext } from "../../../../../rendering/uiRenderContext";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl";
import { UILayoutContext } from "../../../../../ui/uiLayoutContext";
import { fillUiSize, UISize } from "../../../../../ui/uiSize";
import { UIButton } from "../../../../../ui/view/uiButton";

export class UIInventoryGridItem extends UIButton {
    constructor(private sprite: Sprite2, public isSelected: boolean) {
        super({
            width: fillUiSize,
            height: fillUiSize,
        });

        this.defaultBackground = ninePatchBackground({
            sprite: sprites2.book_grid_item,
            sides: allSides(8),
            scale: 1,
        });

        this.onTappedBackground = ninePatchBackground({
            sprite: sprites2.book_grid_item_focused,
            sides: allSides(8),
            scale: 1,
        });
    }

    override layout(
        layoutContext: UILayoutContext,
        constraints: UISize
    ): UISize {
        this._measuredSize = {
            width: constraints.width,
            height: constraints.height,
        };
        return this._measuredSize;
    }

    override draw(context: UIRenderContext): void {
        super.draw(context);
        const size = this._measuredSize;

        if (!size) {
            throw new Error("Measured size not set");
        }

        context.drawScreenSpaceSprite({
            x: this.screenPosition.x + 4,
            y: this.screenPosition.y + 4,
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
}
