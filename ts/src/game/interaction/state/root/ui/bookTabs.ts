import { sprites2 } from "../../../../../module/asset/sprite.js";
import { allSides } from "../../../../../common/sides.js";
import { ninePatchBackground } from "../../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiButton } from "../../../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../../module/ui/dsl/uiColumnDsl.js";
import { uiSpace } from "../../../../../module/ui/dsl/uiSpaceDsl.js";
import { HorizontalAlignment } from "../../../../../module/ui/uiAlignment.js";
import { wrapUiSize } from "../../../../../module/ui/uiSize.js";
import { UIView } from "../../../../../module/ui/uiView.js";

export function bookTabs(onTap: (tab: number) => void): UIView {
    return uiColumn({
        horizontalAlignment: HorizontalAlignment.Right,
        width: 100,
        height: wrapUiSize,
        children: [
            {
                child: uiButton({
                    width: 38,
                    height: 48,
                    onTapCallback: () => {
                        onTap(0);
                    },
                    defaultBackground: ninePatchBackground({
                        sprite: sprites2.book_tab,
                        scale: 1,
                        sides: allSides(8),
                    }),
                }),
            },
            {
                child: uiSpace({
                    width: 1,
                    height: 8,
                }),
            },
            {
                child: uiButton({
                    width: 38,
                    height: 48,
                    onTapCallback: () => {
                        onTap(1);
                    },
                    defaultBackground: ninePatchBackground({
                        sprite: sprites2.book_tab,
                        scale: 1,
                        sides: allSides(8),
                    }),
                }),
            },
            {
                child: uiSpace({
                    width: 1,
                    height: 8,
                }),
            },
            {
                child: uiButton({
                    width: 48,
                    height: 48,
                    onTapCallback: () => {
                        onTap(2);
                    },
                    defaultBackground: ninePatchBackground({
                        sprite: sprites2.book_tab,
                        scale: 1,
                        sides: allSides(8),
                    }),
                }),
            },
        ],
    });
}
