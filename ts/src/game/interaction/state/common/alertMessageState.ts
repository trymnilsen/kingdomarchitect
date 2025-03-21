import { sprites2 } from "../../../../module/asset/sprite.js";
import { allSides, symmetricSides } from "../../../../common/sides.js";
import { bookInkColor } from "../../../../module/ui/color.js";
import { ninePatchBackground } from "../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../module/ui/dsl/uiColumnDsl.js";
import { uiSpace } from "../../../../module/ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../../module/ui/dsl/uiTextDsl.js";
import { fillUiSize, wrapUiSize } from "../../../../module/ui/uiSize.js";
import { InteractionState } from "../../handler/interactionState.js";

export class AlertMessageState extends InteractionState {
    override get stateName(): string {
        return "Message";
    }

    constructor(
        private title: string,
        private text: string,
    ) {
        super();

        const okButton = uiButton({
            onTapCallback: () => {
                this.context.stateChanger.pop(undefined);
            },
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
                    text: "Ok",
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

        this.view = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            children: [
                uiBox({
                    padding: allSides(16),
                    width: 300,
                    height: wrapUiSize,
                    background: ninePatchBackground({
                        sprite: sprites2.stone_slate_background,
                        sides: allSides(16),
                        scale: 4,
                    }),
                    children: [
                        uiColumn({
                            width: fillUiSize,
                            height: wrapUiSize,
                            children: [
                                {
                                    child: uiText({
                                        padding: symmetricSides(0, 8),
                                        text: this.title,
                                        style: {
                                            color: bookInkColor,
                                            font: "Silkscreen",
                                            size: 32,
                                        },
                                        width: fillUiSize,
                                        height: wrapUiSize,
                                    }),
                                },
                                {
                                    child: uiText({
                                        padding: symmetricSides(0, 8),
                                        text: this.text,
                                        style: {
                                            color: bookInkColor,
                                            font: "Silkscreen",
                                            size: 20,
                                        },
                                        width: fillUiSize,
                                        height: wrapUiSize,
                                    }),
                                },
                                {
                                    child: uiSpace({
                                        width: 16,
                                        height: 16,
                                    }),
                                },
                                {
                                    child: okButton,
                                },
                            ],
                        }),
                    ],
                }),
            ],
        });
    }

    override get isModal(): boolean {
        return true;
    }
}
