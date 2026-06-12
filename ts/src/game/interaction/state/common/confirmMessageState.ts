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
    uiRow,
} from "../../../../ui/declarative/uiSequence.ts";
import { uiSpace } from "../../../../ui/declarative/uiSpace.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { InteractionState } from "../../handler/interactionState.ts";

type ConfirmMessageProps = {
    title: string;
    text: string;
    confirmText: string;
    cancelText: string;
    onConfirmTap: () => void;
    onCancelTap: () => void;
};

const confirmButton = (text: string, onTap: () => void) =>
    uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        padding: 16,
        background: ninePatchBackground({
            sprite: spriteRefs.stone_slate_border,
            sides: allSides(6),
            scale: 4,
        }),
        onTap,
        child: uiText({
            content: text,
            textStyle: {
                color: bookInkColor,
                font: "Silkscreen",
                size: 20,
            },
        }),
    });

const confirmMessage = createComponent<ConfirmMessageProps>(
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
                        uiRow({
                            width: fillUiSize,
                            height: wrapUiSize,
                            gap: 16,
                            children: [
                                confirmButton(
                                    props.confirmText,
                                    props.onConfirmTap,
                                ),
                                confirmButton(
                                    props.cancelText,
                                    props.onCancelTap,
                                ),
                            ],
                        }),
                    ],
                }),
            }),
        });
    },
    { displayName: "ConfirmMessage" },
);

/**
 * Modal dialog asking the user to confirm or cancel an action. Pops with
 * `true` when confirmed and `false` when cancelled, delivered to the onPop
 * callback given to `stateChanger.push`.
 */
export class ConfirmMessageState extends InteractionState {
    private title: string;
    private text: string;
    private confirmText: string;
    private cancelText: string;

    override get stateName(): string {
        return "Confirm";
    }

    constructor(
        title: string,
        text: string,
        confirmText: string = "Yes",
        cancelText: string = "No",
    ) {
        super();
        this.title = title;
        this.text = text;
        this.confirmText = confirmText;
        this.cancelText = cancelText;
    }

    override getView(): ComponentDescriptor | null {
        return confirmMessage({
            title: this.title,
            text: this.text,
            confirmText: this.confirmText,
            cancelText: this.cancelText,
            onConfirmTap: () => {
                this.context.stateChanger.pop(true);
            },
            onCancelTap: () => {
                this.context.stateChanger.pop(false);
            },
        });
    }

    override get isModal(): boolean {
        return true;
    }
}
