import { Sprite2, sprites2 } from "../../../../../asset/sprite.ts";
import { allSides } from "../../../../../common/sides.ts";
import { UIThemeType } from "../../../../../ui/color.ts";
import { ninePatchBackground } from "../../../../../ui/uiBackground.ts";
import { createComponent } from "../../../../../ui/declarative/ui.ts";
import { uiButton } from "../../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../../ui/declarative/uiImage.ts";

export type InventoryGridItemProps = {
    sprite?: Sprite2;
    isSelected: boolean;
    theme: UIThemeType;
    onTap?: () => void;
    width: number;
    height: number;
};

export const inventoryGridItem = createComponent<InventoryGridItemProps>(
    ({ props }) => {
        const getBackgroundSprite = (theme: UIThemeType): Sprite2 => {
            switch (theme) {
                case UIThemeType.Book:
                    return sprites2.book_grid_item;
                case UIThemeType.Stone:
                    return sprites2.book_grid_item_gray;
                default:
                    return sprites2.book_grid_item;
            }
        };

        const getFocusedBackgroundSprite = (theme: UIThemeType): Sprite2 => {
            switch (theme) {
                case UIThemeType.Book:
                    return sprites2.book_grid_item_focused;
                case UIThemeType.Stone:
                    return sprites2.book_grid_item_gray_focused;
                default:
                    return sprites2.book_grid_item_focused;
            }
        };

        const backgroundSprite = props.isSelected
            ? getFocusedBackgroundSprite(props.theme)
            : getBackgroundSprite(props.theme);

        const background = ninePatchBackground({
            sprite: backgroundSprite,
            sides: allSides(8),
            scale: 1,
        });

        return uiButton({
            width: props.width,
            height: props.height,
            background: background,
            onTap: props.onTap,
            child: props.sprite
                ? uiImage({
                      sprite: props.sprite,
                      width: 32,
                      height: 32,
                  })
                : undefined,
        });
    },
    { displayName: "InventoryGridItem" },
);
