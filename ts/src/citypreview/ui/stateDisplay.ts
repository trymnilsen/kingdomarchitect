import type { ComponentDescriptor } from "../../ui/declarative/ui.ts";
import { uiColumn } from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { subTitleTextStyle } from "../../rendering/text/textStyle.ts";
import { wrapUiSize } from "../../ui/uiSize.ts";
import { LAYOUT } from "./cityPreviewConstants.ts";
import type { CityPreviewState } from "../cityPreviewState.ts";

export function createStateDisplay(
    state: CityPreviewState,
    width: number,
): ComponentDescriptor {
    return uiColumn({
        width,
        height: wrapUiSize,
        gap: LAYOUT.SECTION_GAP,
        children: [
            uiText({
                content: `Tick: ${state.currentTick}`,
                textStyle: subTitleTextStyle,
                width,
            }),
            uiText({
                content: `Biome: ${state.biome}`,
                textStyle: subTitleTextStyle,
                width,
            }),
            uiText({
                content: `Seed: ${state.seed}`,
                textStyle: subTitleTextStyle,
                width,
            }),
        ],
    });
}
