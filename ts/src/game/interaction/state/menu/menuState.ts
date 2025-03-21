import { sprites2 } from "../../../../module/asset/sprite.js";
import { allSides, symmetricSides } from "../../../../common/sides.js";
import { bookInkColor } from "../../../../module/ui/color.js";
import { ninePatchBackground } from "../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../module/ui/dsl/uiColumnDsl.js";
import { uiSpace } from "../../../../module/ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../../module/ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../module/ui/uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../../../../module/ui/uiSize.js";
import { UIButton } from "../../../../module/ui/view/uiButton.js";
import { InteractionState } from "../../handler/interactionState.js";

export class MenuState extends InteractionState {
    override get stateName(): string {
        return "Menu";
    }

    override get isModal(): boolean {
        return true;
    }

    override onActive(): void {
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(16),
            alignment: uiAlignment.center,
            children: [
                uiBox({
                    width: 300,
                    height: 400,
                    padding: allSides(16),
                    background: ninePatchBackground({
                        scale: 2,
                        sides: allSides(12),
                        sprite: sprites2.stone_slate_background_2x,
                    }),
                    children: [
                        uiColumn({
                            width: fillUiSize,
                            height: wrapUiSize,
                            children: [
                                {
                                    child: getButtonView("New game", () => {
                                        window.localStorage.clear();
                                        location.reload();
                                    }),
                                },
                                {
                                    child: uiSpace({
                                        width: fillUiSize,
                                        height: 16,
                                    }),
                                },
                                {
                                    child: getButtonView("Bindings", () => {}),
                                },
                                {
                                    child: uiSpace({
                                        width: fillUiSize,
                                        height: 16,
                                    }),
                                },
                                {
                                    child: getButtonView("About", () => {}),
                                },
                            ],
                        }),
                    ],
                }),
            ],
        });
        this.view = contentView;
    }
}

function getButtonView(text: string, callback: () => void): UIButton {
    return uiButton({
        onTapCallback: callback,
        padding: allSides(16),
        defaultBackground: ninePatchBackground({
            sprite: sprites2.stone_slate_border,
            sides: allSides(6),
            scale: 4,
        }),
        onTappedBackground: ninePatchBackground({
            sprite: sprites2.stone_slate_border_selected,
            sides: allSides(6),
            scale: 4,
        }),
        children: [
            uiText({
                padding: symmetricSides(0, 8),
                text: text,
                style: {
                    color: bookInkColor,
                    font: "Silkscreen",
                    size: 20,
                },
                width: fillUiSize,
                height: wrapUiSize,
            }),
        ],
        width: fillUiSize,
        height: wrapUiSize,
    });
}
