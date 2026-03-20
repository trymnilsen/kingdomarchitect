import type { ComponentDescriptor } from "../../ui/declarative/ui.ts";
import { uiButton } from "../../ui/declarative/uiButton.ts";
import { uiColumn } from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { boxBackground } from "../../ui/uiBackground.ts";
import { wrapUiSize } from "../../ui/uiSize.ts";
import { subTitleTextStyle } from "../../rendering/text/textStyle.ts";
import { COLORS, LAYOUT } from "./cityPreviewConstants.ts";
import type { BiomeType } from "../../game/map/biome.ts";

const SELECTABLE_BIOMES: BiomeType[] = [
    "plains",
    "forrest",
    "desert",
    "snow",
    "mountains",
    "swamp",
];

export function createBiomeSelector(
    currentBiome: BiomeType,
    onBiomeChange: (biome: BiomeType) => void,
    width: number,
): ComponentDescriptor {
    const buttons: ComponentDescriptor[] = SELECTABLE_BIOMES.map((biome) => {
        const isSelected = biome === currentBiome;
        return uiButton({
            width,
            height: LAYOUT.BUTTON_HEIGHT,
            background: boxBackground({
                fill: isSelected
                    ? COLORS.BUTTON_SELECTED
                    : COLORS.BUTTON_DEFAULT,
                stroke: isSelected
                    ? COLORS.BUTTON_BORDER_SELECTED
                    : COLORS.BUTTON_BORDER,
                strokeWidth: 2,
            }),
            pressedBackground: boxBackground({
                fill: COLORS.BUTTON_PRESSED,
                stroke: COLORS.BUTTON_BORDER_SELECTED,
                strokeWidth: 2,
            }),
            child: uiText({
                content: biome,
                textStyle: subTitleTextStyle,
            }),
            onTap: () => onBiomeChange(biome),
            key: `biome-${biome}`,
        });
    });

    return uiColumn({
        width,
        height: wrapUiSize,
        gap: 2,
        children: buttons,
    });
}
