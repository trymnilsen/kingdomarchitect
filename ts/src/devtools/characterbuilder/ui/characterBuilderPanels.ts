import { titleTextStyle } from "../../../rendering/text/textStyle.ts";
import type { ComponentDescriptor } from "../../../ui/declarative/ui.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiGrid } from "../../../ui/declarative/uiGrid.ts";
import { uiColumn, uiRow } from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { uiAlignment } from "../../../ui/uiAlignment.ts";
import { colorBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import type {
    CharacterColors,
    ColorPart,
} from "../../../rendering/character/characterColors.ts";
import { hatAppearances } from "../../../data/appearance/hatAppearance.ts";
import type { EquipmentSlot } from "../../../game/component/equipmentComponent.ts";
import { CharacterPreview } from "./characterPreview.ts";
import {
    createAnimationButton,
    createColorGridItems,
    createPartButton,
    createPartLayerBox,
    createPrimaryButton,
} from "./characterBuilderButtons.ts";
import {
    BUILDER_SECTIONS,
    COLORS,
    FANTASY_GEAR_COLORS,
    LAYOUT,
    SLOT_OPTIONS,
    type BuilderSection,
    type PreviewMode,
} from "./characterBuilderConstants.ts";
import type { CharacterBuilderSelection } from "./characterBuilderSelection.ts";
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
    selectedSection: BuilderSection,
    onSectionSelect: (section: BuilderSection) => void,
    selection: CharacterBuilderSelection,
    onColorSelect: (part: ColorPart, color: string | undefined) => void,
    selectedSlot: EquipmentSlot | null,
    onSlotSelect: (slot: EquipmentSlot | null) => void,
    onItemSelect: (slot: EquipmentSlot, itemId: string | null) => void,
    onHatSelect: (hatId: string | null) => void,
) {
    let customization: ComponentDescriptor[];
    if (selectedSection === "Hat") {
        customization = createHatSection(selection.hatId, onHatSelect);
    } else if (selectedSection === "Equipment") {
        customization = createEquipmentSection(
            selection,
            selectedSlot,
            onSlotSelect,
            onItemSelect,
        );
    } else {
        customization = createColorSection(selectedSection, onColorSelect);
    }

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
                ...BUILDER_SECTIONS.map((section) =>
                    createPartButton(
                        section,
                        selectedSection === section,
                        () => onSectionSelect(section),
                    ),
                ),
                ...customization,
            ],
        }),
    });
}

function createHatSection(
    activeHatId: string | null,
    onHatSelect: (hatId: string | null) => void,
): ComponentDescriptor[] {
    return [
        uiText({ content: "Hat", textStyle: titleTextStyle }),
        createPartButton("From items", activeHatId === null, () =>
            onHatSelect(null),
        ),
        ...hatAppearances.map((hat) =>
            createPartButton(hat.name, hat.id === activeHatId, () =>
                onHatSelect(hat.id),
            ),
        ),
    ];
}

function createColorSection(
    part: ColorPart,
    onColorSelect: (part: ColorPart, color: string | undefined) => void,
): ComponentDescriptor[] {
    return [
        uiText({
            content: "Color",
            textStyle: titleTextStyle,
        }),
        uiGrid({
            gap: 8,
            width: fillUiSize,
            height: wrapUiSize,
            children: createColorGridItems(FANTASY_GEAR_COLORS, (color) =>
                onColorSelect(part, color),
            ),
        }),
    ];
}

function createEquipmentSection(
    selection: CharacterBuilderSelection,
    selectedSlot: EquipmentSlot | null,
    onSlotSelect: (slot: EquipmentSlot | null) => void,
    onItemSelect: (slot: EquipmentSlot, itemId: string | null) => void,
): ComponentDescriptor[] {
    if (selectedSlot === null) {
        return [
            uiText({
                content: "Slot",
                textStyle: titleTextStyle,
            }),
            ...SLOT_OPTIONS.map((option) =>
                createPartButton(option.name, false, () =>
                    onSlotSelect(option.slot),
                ),
            ),
        ];
    }

    const equippedId = selection.slots[selectedSlot];
    const slotName =
        SLOT_OPTIONS.find((option) => option.slot === selectedSlot)?.name ??
        selectedSlot;
    return [
        uiText({
            content: slotName,
            textStyle: titleTextStyle,
        }),
        createPartButton("< Back", false, () => onSlotSelect(null)),
        createPartButton("None", equippedId === null, () =>
            onItemSelect(selectedSlot, null),
        ),
        ...ITEMS_WITH_VISUAL.map((item) =>
            createPartButton(item.name, item.id === equippedId, () =>
                onItemSelect(selectedSlot, item.id),
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
