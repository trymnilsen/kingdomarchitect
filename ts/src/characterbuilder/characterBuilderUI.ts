import { characterPartFrames } from "../../generated/characterFrames.ts";
import { createComponent } from "../ui/declarative/ui.ts";
import { uiColumn, uiRow } from "../ui/declarative/uiSequence.ts";
import { fillUiSize } from "../ui/uiSize.ts";
import type { CharacterColors } from "./colors.ts";
import {
    createAnimationPanel,
    createHeaderBar,
    createLayerPanel,
    createPartSelectionPanel,
    createPreviewPanel,
} from "./ui/CharacterBuilderPanels.ts";
import {
    EQUIPMENT_OPTIONS,
    type BodyPart,
    type PreviewMode,
} from "./ui/characterBuilderConstants.ts";

/**
 * Main UI component for the character builder
 * Manages the layout and state for part selection, color customization,
 * and animation preview
 */
export const CharacterBuilderUI = createComponent(({ withState }) => {
    const [selectedPart, setSelectedPart] = withState<BodyPart>("Chest");
    const [selectedAnimation, setSelectedAnimation] = withState<string>(
        characterPartFrames[0].animationName,
    );
    const [selectedColors, setSelectedColors] = withState<CharacterColors>({});
    const [previewMode, setPreviewMode] = withState<PreviewMode>("Single");
    const [currentFrame, setCurrentFrame] = withState<number>(0);
    const [selectedAnchor, setSelectedAnchor] = withState<string | null>(null);

    const handlePartSelect = (part: BodyPart) => {
        setSelectedPart(part);
        if (part !== "Equipment") {
            setSelectedAnchor(null);
        }
    };

    const handleColorSelect = (color: string | undefined) => {
        const newColors = { ...selectedColors };
        newColors[selectedPart] = color;
        console.log("Color updated:", newColors);
        setSelectedColors(newColors);
    };

    const handleEquipmentSelect = (anchorId: string, equipmentId: string) => {
        const existing = selectedColors.Equipment ?? [];
        const filtered = existing.filter((e) => e.anchor !== anchorId);
        const option = EQUIPMENT_OPTIONS.find((o) => o.id === equipmentId);
        if (option && option.sprite && option.offset) {
            filtered.push({
                sprite: option.sprite,
                offsetInSpriteForAnchorPoint: option.offset,
                anchor: anchorId,
            });
        }
        setSelectedColors({ ...selectedColors, Equipment: filtered });
    };

    // Get the current animation's frame count
    const getCurrentFrameCount = (): number => {
        const animation = characterPartFrames.find(
            (f) => f.animationName === selectedAnimation,
        );
        return animation?.parts[0]?.frames.length || 0;
    };

    const handlePreviousFrame = () => {
        if (previewMode === "Single") {
            const frameCount = getCurrentFrameCount();
            setCurrentFrame((prev) => {
                if (prev === 0) {
                    return frameCount - 1; // Loop to last frame
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
                    return 0; // Loop to first frame
                }
                return prev + 1;
            });
        }
    };

    const handleAnimationChange = (animation: string) => {
        setSelectedAnimation(animation);
        setCurrentFrame(0); // Reset frame when changing animation
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
                        selectedPart,
                        handlePartSelect,
                        selectedColors,
                        handleColorSelect,
                        selectedAnchor,
                        setSelectedAnchor,
                        handleEquipmentSelect,
                    ),
                    createPreviewPanel(
                        previewMode,
                        setPreviewMode,
                        selectedColors,
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
                    ),
                ],
            }),
        ],
    });
});
