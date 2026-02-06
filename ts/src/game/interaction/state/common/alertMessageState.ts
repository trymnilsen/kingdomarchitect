import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import {
    CrossAxisAlignment,
    uiColumn,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiSpace } from "../../../../ui/declarative/uiSpace.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { InteractionState } from "../../handler/interactionState.ts";

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
                    sprite: spriteRefs.stone_slate_background,
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
                                sprite: spriteRefs.stone_slate_border,
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
    private title: string;
    private text: string;

    override get stateName(): string {
        return "Message";
    }

    constructor(title: string, text: string) {
        super();
        this.title = title;
        this.text = text;
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
