import { allSides } from "../../../../common/sides.js";
import { sprites2 } from "../../../../asset/sprite.js";
import { bookInkColor } from "../../../../ui/color.js";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.js";
import { uiBox } from "../../../../ui/declarative/uiBox.js";
import { uiButton } from "../../../../ui/declarative/uiButton.js";
import {
    CrossAxisAlignment,
    uiColumn,
} from "../../../../ui/declarative/uiSequence.js";
import { uiSpace } from "../../../../ui/declarative/uiSpace.js";
import { uiText } from "../../../../ui/declarative/uiText.js";
import { ninePatchBackground } from "../../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { InteractionState } from "../../handler/interactionState.js";

type AlertMessageProps = {
    title: string;
    text: string;
    onOkTap: () => void;
};

const alertMessage = createComponent<AlertMessageProps>(
    ({ props }) => {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            child: uiBox({
                width: 300,
                height: wrapUiSize,
                background: ninePatchBackground({
                    sprite: sprites2.stone_slate_background,
                    sides: allSides(16),
                    scale: 4,
                }),
                padding: 16,
                child: uiColumn({
                    width: fillUiSize,
                    height: wrapUiSize,
                    crossAxisAlignment: CrossAxisAlignment.Center,
                    gap: 16,
                    children: [
                        uiText({
                            content: props.title,
                            textStyle: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 32,
                            },
                        }),
                        uiText({
                            content: props.text,
                            textStyle: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 20,
                            },
                        }),
                        uiSpace({
                            height: 32,
                        }),
                        uiButton({
                            width: fillUiSize,
                            height: wrapUiSize,
                            padding: 16,
                            background: ninePatchBackground({
                                sprite: sprites2.stone_slate_border,
                                sides: allSides(6),
                                scale: 4,
                            }),
                            onTap: props.onOkTap,
                            child: uiText({
                                content: "Ok",
                                textStyle: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 20,
                                },
                            }),
                        }),
                    ],
                }),
            }),
        });
    },
    { displayName: "AlertMessage" },
);

export class AlertMessageState extends InteractionState {
    override get stateName(): string {
        return "Message";
    }

    constructor(
        private title: string,
        private text: string,
    ) {
        super();
    }

    override getView(): ComponentDescriptor | null {
        return alertMessage({
            title: this.title,
            text: this.text,
            onOkTap: () => {
                this.context.stateChanger.pop(undefined);
            },
        });
    }

    override get isModal(): boolean {
        return true;
    }
}
