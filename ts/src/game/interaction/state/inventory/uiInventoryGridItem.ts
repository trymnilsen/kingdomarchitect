import { ImageAsset } from "../../../../asset/assets";
import { allSides } from "../../../../common/sides";
import { UIRenderContext } from "../../../../rendering/uiRenderContext";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { UILayoutContext } from "../../../../ui/uiLayoutContext";
import { UISize } from "../../../../ui/uiSize";
import { fillUiSize } from "../../../../ui/uiView";
import { UIButton } from "../../../../ui/view/uiButton";

export class UIInventoryGridItem extends UIButton {
    constructor(private asset: ImageAsset, public isSelected: boolean) {
        super({
            width: fillUiSize,
            height: fillUiSize,
        });

        this.defaultBackground = ninePatchBackground({
            asset: "book_grid_item",
            sides: allSides(8),
            scale: 1,
        });

        this.onTappedBackground = ninePatchBackground({
            asset: "book_grid_item_focused",
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

        context.drawScreenSpaceImage(
            {
                x: this.screenPosition.x + 4,
                y: this.screenPosition.y + 4,
                image: this.asset,
            },
            1
        );

        if (this.isSelected) {
            context.drawNinePatchImage({
                x: this.screenPosition.x - 4,
                y: this.screenPosition.y - 4,
                width: size.width + 8,
                height: size.height + 8,
                scale: 1,
                asset: "cursor",
                sides: allSides(12),
            });
        }
    }
}
