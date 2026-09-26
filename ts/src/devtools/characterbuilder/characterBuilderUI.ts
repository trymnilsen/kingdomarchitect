import { log } from "../../common/logging/logger.ts";
import { characterPartFrames } from "../../../generated/characterFrames.ts";
import { getAllAnimations } from "./animation/getAllAnimations.ts";
import type { CharacterAnimation } from "../../rendering/character/characterAnimation.ts";
import { createComponent } from "../../ui/declarative/ui.ts";
import { uiColumn, uiRow } from "../../ui/declarative/uiSequence.ts";
import { fillUiSize } from "../../ui/uiSize.ts";
import {
    EquipmentSpriteVariantType,
    type CharacterColors,
} from "../../rendering/character/characterColors.ts";
import {
    createAnimationPanel,
    createHeaderBar,
    createLayerPanel,
    createPartSelectionPanel,
    createPreviewPanel,
} from "./ui/characterBuilderPanels.ts";
import {
    type BodyPart,
    type PreviewMode,
} from "./ui/characterBuilderConstants.ts";
import { ITEMS_WITH_VISUAL } from "./ui/itemsWithVisual.ts";
import { spriteRefs } from "../../asset/sprite.ts";

const allAnimations = getAllAnimations(
    characterPartFrames as unknown as CharacterAnimation[],
);

export const CharacterBuilderUI = createComponent(({ withState }) => {
    const [selectedPart, setSelectedPart] = withState<BodyPart>("Chest");
    const [selectedAnimation, setSelectedAnimation] = withState<string>(
        allAnimations[0].animationName,
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
        log.info("Color updated", { newColors });
        setSelectedColors(newColors);
    };

    const handleHatSelect = (hatId: string) => {
        const existing = (selectedColors.Equipment ?? []).filter(
            (e) => !("attachToPart" in e && e.attachToPart === "Head"),
        );
        if (hatId !== "none") {
            existing.push({
                attachToPart: "Head",
                sprite: {
                    type: EquipmentSpriteVariantType.Single,
                    sprite: spriteRefs.wizard_hat,
                    offset: { x: 6, y: 10 },
                },
            });
        }
        setSelectedColors({
            ...selectedColors,
            Equipment: existing.length > 0 ? existing : undefined,
        });
    };

    const handleEquipmentSelect = (anchorId: string, itemId: string | null) => {
        const existing = selectedColors.Equipment ?? [];
        const filtered = existing.filter(
            (e) => !("anchor" in e) || e.anchor !== anchorId,
        );
        const item = ITEMS_WITH_VISUAL.find((i) => i.id === itemId);
        if (item) {
            filtered.push({ anchor: anchorId, sprite: item.visual });
        }
        setSelectedColors({ ...selectedColors, Equipment: filtered });
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
                        selectedPart,
                        handlePartSelect,
                        selectedColors,
                        handleColorSelect,
                        selectedAnchor,
                        setSelectedAnchor,
                        handleEquipmentSelect,
                        handleHatSelect,
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
                        allAnimations.map((a) => a.animationName),
                    ),
                ],
            }),
        ],
    });
});
