import { sprites2 } from "../../../../asset/sprite";
import { allSides, symmetricSides } from "../../../../common/sides";
import { bookInkColor } from "../../../../ui/color";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { uiSpace } from "../../../../ui/dsl/uiSpaceDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiView";
import { InteractionState } from "../../handler/interactionState";

export class AlertMessageState extends InteractionState {
    constructor(private title: string, private text: string) {
        super();
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
                                    child: uiButton({
                                        onTapCallback: () => {
                                            this.context.stateChanger.pop(
                                                undefined
                                            );
                                        },
                                        padding: allSides(16),
                                        defaultBackground: ninePatchBackground({
                                            sprite: sprites2.stone_slate_border,
                                            sides: allSides(6),
                                            scale: 4,
                                        }),
                                        onTappedBackground: ninePatchBackground(
                                            {
                                                sprite: sprites2.stone_slate_border_selected,
                                                sides: allSides(6),
                                                scale: 4,
                                            }
                                        ),
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
                                    }),
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
