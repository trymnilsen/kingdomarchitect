import { characterPartFrames } from "../../../generated/characterFrames.js";
import { titleTextStyle } from "../../rendering/text/textStyle.js";
import { uiBox } from "../../ui/declarative/uiBox.js";
import { uiGrid } from "../../ui/declarative/uiGrid.js";
import { uiColumn, uiRow } from "../../ui/declarative/uiSequence.js";
import { uiText } from "../../ui/declarative/uiText.js";
import { uiAlignment } from "../../ui/uiAlignment.js";
import { colorBackground } from "../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../ui/uiSize.js";
import type { CharacterColors } from "../colors.js";
import { CharacterPreview } from "./CharacterPreview.js";
import {
    createAnimationButton,
    createColorGridItems,
    createPartButton,
    createPartLayerBox,
    createPrimaryButton,
} from "./CharacterBuilderButtons.js";
import {
    BODY_PARTS,
    COLORS,
    FANTASY_GEAR_COLORS,
    LAYOUT,
    type BodyPart,
    type PreviewMode,
} from "./characterBuilderConstants.js";

/**
 * Creates the top header bar
 */
export function createHeaderBar() {
    return uiBox({
        width: fillUiSize,
        height: LAYOUT.TOP_BAR_HEIGHT,
        background: colorBackground(COLORS.BACKGROUND_BLACK),
        child: uiText({
            content: "Character Builder",
            textStyle: titleTextStyle,
        }),
        padding: 16,
    });
}

/**
 * Creates the left panel for part selection and color customization
 */
export function createPartSelectionPanel(
    selectedPart: BodyPart,
    onPartSelect: (part: BodyPart) => void,
    selectedColors: CharacterColors,
    onColorSelect: (color: string) => void,
) {
    return uiBox({
        width: LAYOUT.LEFT_PANEL_WIDTH,
        height: fillUiSize,
        background: colorBackground(COLORS.BACKGROUND_DARK),
        padding: 12,
        child: uiColumn({
            gap: 8,
            children: [
                uiText({
                    content: "Parts",
                    textStyle: titleTextStyle,
                }),
                ...BODY_PARTS.map((part) =>
                    createPartButton(part, selectedPart === part, () =>
                        onPartSelect(part),
                    ),
                ),
                uiBox({
                    width: fillUiSize,
                    height: 1,
                    background: colorBackground(COLORS.DIVIDER),
                }),
                uiGrid({
                    gap: 8,
                    width: fillUiSize,
                    height: wrapUiSize,
                    children: createColorGridItems(
                        FANTASY_GEAR_COLORS,
                        (color) => {
                            const newColor = { ...selectedColors };
                            newColor[selectedPart] = color;
                            onColorSelect(color);
                        },
                    ),
                }),
            ],
        }),
    });
}

/**
 * Creates the center preview area with mode toggle and sprite preview
 */
export function createPreviewPanel(
    previewMode: PreviewMode,
    onModeChange: (mode: PreviewMode) => void,
    selectedColors: CharacterColors,
    selectedAnimation: string,
) {
    return uiColumn({
        width: fillUiSize,
        children: [
            uiRow({
                children: [
                    createPrimaryButton(
                        "Sheet",
                        () => onModeChange("Sheet"),
                        previewMode === "Sheet",
                    ),
                    createPrimaryButton(
                        "Single",
                        () => onModeChange("Single"),
                        previewMode === "Single",
                    ),
                ],
            }),
            uiBox({
                width: fillUiSize,
                height: fillUiSize,
                child: CharacterPreview({
                    colors: selectedColors,
                    previewMode,
                    selectedAnimation,
                }),
            }),
        ],
    });
}

/**
 * Creates the layer management panel
 */
export function createLayerPanel() {
    return uiBox({
        width: LAYOUT.LAYER_BOX_SIZE,
        height: fillUiSize,
        padding: 8,
        alignment: uiAlignment.topCenter,
        child: uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: [
                createPartLayerBox(),
                createPartLayerBox(),
                createPartLayerBox(),
            ],
        }),
    });
}

/**
 * Creates the right panel for animations and playback controls
 */
export function createAnimationPanel(
    selectedAnimation: string,
    onAnimationSelect: (animation: string) => void,
) {
    return uiBox({
        width: LAYOUT.RIGHT_PANEL_WIDTH,
        height: fillUiSize,
        background: colorBackground(COLORS.BACKGROUND_DARK),
        padding: 12,
        child: uiColumn({
            gap: 8,
            children: [
                uiText({
                    content: "Playback",
                    textStyle: titleTextStyle,
                }),
                uiRow({
                    children: [
                        createPrimaryButton("|<", () =>
                            console.log("First frame"),
                        ),
                        createPrimaryButton(">", () => console.log("Play")),
                        createPrimaryButton("||", () => console.log("Pause")),
                        createPrimaryButton(">|", () =>
                            console.log("Last frame"),
                        ),
                    ],
                }),
                uiText({
                    content: "Animations",
                    textStyle: titleTextStyle,
                }),
                ...characterPartFrames.map((frame) =>
                    createAnimationButton(
                        frame.animationName,
                        selectedAnimation === frame.animationName,
                        () => onAnimationSelect(frame.animationName),
                    ),
                ),
            ],
        }),
    });
}
