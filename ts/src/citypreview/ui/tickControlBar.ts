import type { ComponentDescriptor } from "../../ui/declarative/ui.ts";
import { uiButton } from "../../ui/declarative/uiButton.ts";
import { uiRow } from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { boxBackground } from "../../ui/uiBackground.ts";

import { subTitleTextStyle } from "../../rendering/text/textStyle.ts";
import { COLORS, LAYOUT } from "./cityPreviewConstants.ts";
import type { CityPreviewCallbacks } from "../cityPreviewUI.ts";

const TICK_STEPS = [1, 5, 10, 25, 50, 100] as const;

export function createTickControlBar(
    callbacks: CityPreviewCallbacks,
    width: number,
): ComponentDescriptor {
    const stepButtonWidth = Math.floor(
        (width - LAYOUT.BUTTON_HEIGHT - LAYOUT.SECTION_GAP) / TICK_STEPS.length,
    );

    const stepButtons: ComponentDescriptor[] = TICK_STEPS.map((step) =>
        uiButton({
            width: stepButtonWidth,
            height: LAYOUT.BUTTON_HEIGHT,
            background: boxBackground({
                fill: COLORS.BUTTON_DEFAULT,
                stroke: COLORS.BUTTON_BORDER,
                strokeWidth: 2,
            }),
            pressedBackground: boxBackground({
                fill: COLORS.BUTTON_PRESSED,
                stroke: COLORS.BUTTON_BORDER_SELECTED,
                strokeWidth: 2,
            }),
            child: uiText({
                content: `+${step}`,
                textStyle: subTitleTextStyle,
            }),
            onTap: () => callbacks.onAdvance(step),
            key: `tick-${step}`,
        }),
    );

    const resetButton = uiButton({
        width: LAYOUT.BUTTON_HEIGHT,
        height: LAYOUT.BUTTON_HEIGHT,
        background: boxBackground({
            fill: COLORS.RESET_BUTTON_DEFAULT,
            stroke: COLORS.RESET_BUTTON_BORDER,
            strokeWidth: 2,
        }),
        pressedBackground: boxBackground({
            fill: COLORS.RESET_BUTTON_PRESSED,
            stroke: COLORS.RESET_BUTTON_BORDER,
            strokeWidth: 2,
        }),
        child: uiText({
            content: "R",
            textStyle: subTitleTextStyle,
        }),
        onTap: callbacks.onReset,
    });

    return uiRow({
        width,
        height: LAYOUT.BUTTON_HEIGHT,
        gap: 0,
        children: [...stepButtons, resetButton],
    });
}
