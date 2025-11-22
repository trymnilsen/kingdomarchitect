import { characterPartFrames } from "../../generated/characterFrames.js";
import { createComponent } from "../ui/declarative/ui.js";
import { uiColumn, uiRow } from "../ui/declarative/uiSequence.js";
import { fillUiSize } from "../ui/uiSize.js";
import type { CharacterColors } from "./colors.js";
import {
    createAnimationPanel,
    createHeaderBar,
    createLayerPanel,
    createPartSelectionPanel,
    createPreviewPanel,
} from "./ui/CharacterBuilderPanels.js";
import {
    type BodyPart,
    type PreviewMode,
} from "./ui/characterBuilderConstants.js";

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

    const handleColorSelect = (color: string) => {
        const newColors = { ...selectedColors };
        newColors[selectedPart] = color;
        console.log("Color updated:", newColors);
        setSelectedColors(newColors);
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
                        setSelectedPart,
                        selectedColors,
                        handleColorSelect,
                    ),
                    createPreviewPanel(
                        previewMode,
                        setPreviewMode,
                        selectedColors,
                        selectedAnimation,
                    ),
                    createLayerPanel(),
                    createAnimationPanel(
                        selectedAnimation,
                        setSelectedAnimation,
                    ),
                ],
            }),
        ],
    });
});
