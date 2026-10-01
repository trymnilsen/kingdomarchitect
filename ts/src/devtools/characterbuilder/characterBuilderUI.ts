import { log } from "../../common/logging/logger.ts";
import { characterPartFrames } from "../../../generated/characterFrames.ts";
import { getAllAnimations } from "./animation/getAllAnimations.ts";
import type { CharacterAnimation } from "../../rendering/character/characterAnimation.ts";
import { createComponent } from "../../ui/declarative/ui.ts";
import { uiColumn, uiRow } from "../../ui/declarative/uiSequence.ts";
import { fillUiSize } from "../../ui/uiSize.ts";
import type { ColorPart } from "../../rendering/character/characterColors.ts";
import type { EquipmentSlot } from "../../game/component/equipmentComponent.ts";
import {
    createAnimationPanel,
    createHeaderBar,
    createLayerPanel,
    createPartSelectionPanel,
    createPreviewPanel,
} from "./ui/characterBuilderPanels.ts";
import {
    type BuilderSection,
    type PreviewMode,
} from "./ui/characterBuilderConstants.ts";
import {
    createEmptySelection,
    toCharacterColors,
    type CharacterBuilderSelection,
} from "./ui/characterBuilderSelection.ts";

const allAnimations = getAllAnimations(
    characterPartFrames as unknown as CharacterAnimation[],
);

export const CharacterBuilderUI = createComponent(({ withState }) => {
    const [selectedSection, setSelectedSection] =
        withState<BuilderSection>("Chest");
    const [selectedAnimation, setSelectedAnimation] = withState<string>(
        allAnimations[0].animationName,
    );
    const [selection, setSelection] = withState<CharacterBuilderSelection>(
        createEmptySelection(),
    );
    const [previewMode, setPreviewMode] = withState<PreviewMode>("Single");
    const [currentFrame, setCurrentFrame] = withState<number>(0);
    const [selectedSlot, setSelectedSlot] = withState<EquipmentSlot | null>(
        null,
    );

    const handleSectionSelect = (section: BuilderSection) => {
        setSelectedSection(section);
        if (section !== "Equipment") {
            setSelectedSlot(null);
        }
    };

    const handleColorSelect = (part: ColorPart, color: string | undefined) => {
        const partColors = { ...selection.partColors };
        if (color === undefined) {
            delete partColors[part];
        } else {
            partColors[part] = color;
        }
        log.info("Color updated", { partColors });
        setSelection({ ...selection, partColors });
    };

    const handleHatSelect = (hatId: string | null) => {
        setSelection({ ...selection, hatId });
    };

    const handleItemSelect = (slot: EquipmentSlot, itemId: string | null) => {
        setSelection({
            ...selection,
            slots: { ...selection.slots, [slot]: itemId },
        });
    };

    const getCurrentFrameCount = (): number => {
        const animation = allAnimations.find(
            (a) => a.animationName === selectedAnimation,
        );
        return animation?.parts[0]?.frames.length ?? 0;
    };

    const handlePreviousFrame = () => {
        if (previewMode === "Single") {
            const frameCount = getCurrentFrameCount();
            setCurrentFrame((prev) => {
                if (prev === 0) {
                    return frameCount - 1;
                }
                return prev - 1;
            });
        }
    };

    const handleNextFrame = () => {
        if (previewMode === "Single") {
            const frameCount = getCurrentFrameCount();
            setCurrentFrame((prev) => {
                if (prev >= frameCount - 1) {
                    return 0;
                }
                return prev + 1;
            });
        }
    };

    const handleAnimationChange = (animation: string) => {
        setSelectedAnimation(animation);
        setCurrentFrame(0);
    };

    return uiColumn({
        width: fillUiSize,
        height: fillUiSize,
        children: [
            createHeaderBar(),
            uiRow({
                width: fillUiSize,
                height: fillUiSize,
                children: [
                    createPartSelectionPanel(
                        selectedSection,
                        handleSectionSelect,
                        selection,
                        handleColorSelect,
                        selectedSlot,
                        setSelectedSlot,
                        handleItemSelect,
                        handleHatSelect,
                    ),
                    createPreviewPanel(
                        previewMode,
                        setPreviewMode,
                        toCharacterColors(selection),
                        selectedAnimation,
                        currentFrame,
                    ),
                    createLayerPanel(),
                    createAnimationPanel(
                        selectedAnimation,
                        handleAnimationChange,
                        previewMode,
                        handlePreviousFrame,
                        handleNextFrame,
                        currentFrame,
                        getCurrentFrameCount(),
                        allAnimations.map((a) => a.animationName),
                    ),
                ],
            }),
        ],
    });
});
