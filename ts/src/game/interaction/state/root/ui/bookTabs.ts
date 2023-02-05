import { allSides } from "../../../../../common/sides";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../../ui/dsl/uiColumnDsl";
import { uiSpace } from "../../../../../ui/dsl/uiSpaceDsl";
import { HorizontalAlignment } from "../../../../../ui/uiAlignment";
import { UIView, wrapUiSize } from "../../../../../ui/uiView";

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
                        asset: "book_tab",
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
                        asset: "book_tab",
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
                        asset: "book_tab",
                        scale: 1,
                        sides: allSides(8),
                    }),
                }),
            },
        ],
    });
}
