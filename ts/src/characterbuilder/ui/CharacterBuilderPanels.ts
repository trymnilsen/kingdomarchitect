import { characterPartFrames } from "../../../generated/characterFrames.ts";
import { titleTextStyle } from "../../rendering/text/textStyle.ts";
import type { ComponentDescriptor } from "../../ui/declarative/ui.ts";
import { uiBox } from "../../ui/declarative/uiBox.ts";
import { uiGrid } from "../../ui/declarative/uiGrid.ts";
import { uiColumn, uiRow } from "../../ui/declarative/uiSequence.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { uiAlignment } from "../../ui/uiAlignment.ts";
import { colorBackground } from "../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../ui/uiSize.ts";
import type { CharacterColors } from "../colors.ts";
import { CharacterPreview } from "./CharacterPreview.ts";
import {
    createAnimationButton,
    createColorGridItems,
    createPartButton,
    createPartLayerBox,
    createPrimaryButton,
} from "./CharacterBuilderButtons.ts";
import {
    AVAILABLE_ANCHORS,
    BODY_PARTS,
    COLORS,
    EQUIPMENT_OPTIONS,
    FANTASY_GEAR_COLORS,
    LAYOUT,
    type BodyPart,
    type PreviewMode,
} from "./characterBuilderConstants.ts";

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
    onColorSelect: (color: string | undefined) => void,
    selectedAnchor: string | null,
    onAnchorSelect: (anchor: string | null) => void,
    onEquipmentSelect: (anchorId: string, equipmentId: string) => void,
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
                ...createCustomizationSection(
                    selectedPart,
                    selectedColors,
                    onColorSelect,
                    selectedAnchor,
                    onAnchorSelect,
                    onEquipmentSelect,
                ),
            ],
        }),
    });
}

function createCustomizationSection(
    selectedPart: BodyPart,
    selectedColors: CharacterColors,
    onColorSelect: (color: string | undefined) => void,
    selectedAnchor: string | null,
    onAnchorSelect: (anchor: string | null) => void,
    onEquipmentSelect: (anchorId: string, equipmentId: string) => void,
): ComponentDescriptor[] {
    if (selectedPart !== "Equipment") {
        return [
            uiText({
                content: "Color",
                textStyle: titleTextStyle,
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
        ];
    }

    if (selectedAnchor === null) {
        return [
            uiText({
                content: "Anchor",
                textStyle: titleTextStyle,
            }),
            ...AVAILABLE_ANCHORS.map((anchor) =>
                createPartButton(anchor, false, () =>
                    onAnchorSelect(anchor),
                ),
            ),
        ];
    }

    return [
        uiText({
            content: selectedAnchor,
            textStyle: titleTextStyle,
        }),
        createPartButton("< Back", false, () => onAnchorSelect(null)),
        ...EQUIPMENT_OPTIONS.map((option) =>
            createPartButton(option.name, false, () =>
                onEquipmentSelect(selectedAnchor, option.id),
            ),
        ),
    ];
}

/**
 * Creates the center preview area with mode toggle and sprite preview
 */
export function createPreviewPanel(
    previewMode: PreviewMode,
    onModeChange: (mode: PreviewMode) => void,
    selectedColors: CharacterColors,
    selectedAnimation: string,
    currentFrame: number,
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
                    currentFrame,
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
    previewMode: PreviewMode,
    onPreviousFrame: () => void,
    onNextFrame: () => void,
    currentFrame: number,
    frameCount: number,
) {
    const isPlaybackEnabled = previewMode === "Single";
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
                        createPrimaryButton(
                            "<",
                            onPreviousFrame,
                            false,
                            !isPlaybackEnabled,
                        ),
                        uiBox({
                            width: fillUiSize,
                            height: wrapUiSize,
                            padding: 0,
                            child: uiText({
                                content: isPlaybackEnabled
                                    ? `${currentFrame + 1} / ${frameCount}`
                                    : "-",
                                textStyle: titleTextStyle,
                            }),
                        }),
                        createPrimaryButton(
                            ">",
                            onNextFrame,
                            false,
                            !isPlaybackEnabled,
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
