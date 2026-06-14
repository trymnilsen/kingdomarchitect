import { allSides } from "../../common/sides.ts";
import { spriteRefs } from "../../asset/sprite.ts";
import { bookInkColor } from "../color.ts";
import { ninePatchBackground } from "../uiBackground.ts";
import { wrapUiSize } from "../uiSize.ts";
import { createComponent, type ComponentDescriptor } from "./ui.ts";
import { uiBox } from "./uiBox.ts";
import { uiButton } from "./uiButton.ts";
import { CrossAxisAlignment, MainAxisAlignment, uiRow } from "./uiSequence.ts";
import { uiText } from "./uiText.ts";

export type UiChipProps = {
    label: string;
    /** When true a dismiss affordance is shown that calls onDismiss. */
    dismissable?: boolean;
    onDismiss?: () => void;
};

const chipTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

/**
 * A small pill showing a filter label, with an optional dismiss affordance.
 * Whether the dismiss is shown is driven entirely by the `dismissable` prop —
 * the chip itself does not decide which filters can be removed.
 */
export const uiChip = createComponent<UiChipProps>(
    ({ props }) => {
        const children: ComponentDescriptor[] = [
            uiText({ content: props.label, textStyle: chipTextStyle }),
        ];

        if (props.dismissable) {
            children.push(
                uiButton({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    padding: 2,
                    onTap: props.onDismiss,
                    child: uiText({ content: "x", textStyle: chipTextStyle }),
                }),
            );
        }

        return uiBox({
            width: wrapUiSize,
            height: wrapUiSize,
            padding: 6,
            background: ninePatchBackground({
                sprite: spriteRefs.book_border,
                sides: allSides(8),
            }),
            child: uiRow({
                width: wrapUiSize,
                height: wrapUiSize,
                gap: 6,
                mainAxisAlignment: MainAxisAlignment.Center,
                crossAxisAlignment: CrossAxisAlignment.Center,
                children,
            }),
        });
    },
    { displayName: "UiChip" },
);
