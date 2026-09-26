import { titleTextStyle } from "../../../rendering/text/textStyle.ts";
import type { ComponentDescriptor } from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiGrid } from "../../../ui/declarative/uiGrid.ts";
import { uiColumn, uiRow } from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { uiAlignment } from "../../../ui/uiAlignment.ts";
import { colorBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import type { CharacterColors } from "../../../rendering/character/characterColors.ts";
import { CharacterPreview } from "./characterPreview.ts";
import {
    createAnimationButton,
    createColorGridItems,
    createPartButton,
    createPartLayerBox,
    createPrimaryButton,
} from "./characterBuilderButtons.ts";
import {
    AVAILABLE_ANCHORS,
    BODY_PARTS,
    COLORS,
    FANTASY_GEAR_COLORS,
    HAT_OPTIONS,
    LAYOUT,
    type BodyPart,
    type PreviewMode,
} from "./characterBuilderConstants.ts";
import { ITEMS_WITH_VISUAL } from "./itemsWithVisual.ts";

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

export function createPartSelectionPanel(
    selectedPart: BodyPart,
    onPartSelect: (part: BodyPart) => void,
    selectedColors: CharacterColors,
    onColorSelect: (color: string | undefined) => void,
    selectedAnchor: string | null,
    onAnchorSelect: (anchor: string | null) => void,
    onEquipmentSelect: (anchorId: string, itemId: string | null) => void,
    onHatSelect: (hatId: string) => void,
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
                    onHatSelect,
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
    onEquipmentSelect: (anchorId: string, itemId: string | null) => void,
    onHatSelect: (hatId: string) => void,
): ComponentDescriptor[] {
    if (selectedPart === "Hat") {
        const activeHatId = selectedColors.Equipment?.some(
            (e) => "attachToPart" in e && e.attachToPart === "Head",
        )
            ? "hat"
            : "none";
        return [
            uiText({ content: "Hat", textStyle: titleTextStyle }),
            ...HAT_OPTIONS.map((option) =>
                createPartButton(option.name, option.id === activeHatId, () =>
                    onHatSelect(option.id),
                ),
            ),
        ];
    }

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
                children: createColorGridItems(FANTASY_GEAR_COLORS, (color) => {
                    const newColor = { ...selectedColors };
                    newColor[selectedPart] = color;
                    onColorSelect(color);
                }),
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
                createPartButton(anchor, false, () => onAnchorSelect(anchor)),
            ),
        ];
    }

    return [
        uiText({
            content: selectedAnchor,
            textStyle: titleTextStyle,
        }),
        createPartButton("< Back", false, () => onAnchorSelect(null)),
        createPartButton("None", false, () =>
            onEquipmentSelect(selectedAnchor, null),
        ),
        ...ITEMS_WITH_VISUAL.map((item) =>
            createPartButton(item.name, false, () =>
                onEquipmentSelect(selectedAnchor, item.id),
            ),
        ),
    ];
}

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

export function createAnimationPanel(
    selectedAnimation: string,
    onAnimationSelect: (animation: string) => void,
    previewMode: PreviewMode,
    onPreviousFrame: () => void,
    onNextFrame: () => void,
    currentFrame: number,
    frameCount: number,
    animationNames: string[],
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
                ...animationNames.map((name) =>
                    createAnimationButton(
                        name,
                        selectedAnimation === name,
                        () => onAnimationSelect(name),
                    ),
                ),
            ],
        }),
    });
}
