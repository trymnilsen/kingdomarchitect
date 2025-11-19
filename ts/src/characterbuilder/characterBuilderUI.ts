import {
    createComponent,
    sized,
    type ComponentDescriptor,
} from "../ui/declarative/ui.js";
import { uiColumn, uiRow } from "../ui/declarative/uiSequence.js";
import { uiText } from "../ui/declarative/uiText.js";
import { uiSpace } from "../ui/declarative/uiSpace.js";
import { uiBox } from "../ui/declarative/uiBox.js";
import { uiButton } from "../ui/declarative/uiButton.js";
import {
    titleTextStyle,
    subTitleTextStyle,
} from "../rendering/text/textStyle.js";
import { fillUiSize, wrapUiSize } from "../ui/uiSize.js";
import { colorBackground, boxBackground } from "../ui/uiBackground.js";
import { uiImage } from "../ui/declarative/uiImage.js";
import { buildSpriteSheet } from "./characterSpriteGenerator.js";
import { characterPartFrames } from "../../generated/characterFrames.js";
import { uiGrid } from "../ui/declarative/uiGrid.js";
import { uiAlignment } from "../ui/uiAlignment.js";
import { uiStack } from "../ui/declarative/uiStack.js";

/**
 * Creates a part selection button
 * Extracted to module scope to avoid closure issues
 */
const createPartButton = (
    partName: string,
    isSelected: boolean,
    onSelect: () => void,
) => {
    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        background: boxBackground({
            fill: isSelected
                ? "rgba(100, 150, 100, 0.8)"
                : "rgba(50, 50, 50, 0.8)",
            stroke: isSelected
                ? "rgba(150, 200, 150, 1)"
                : "rgba(100, 100, 100, 1)",
            strokeWidth: 2,
        }),
        pressedBackground: boxBackground({
            fill: "rgba(70, 120, 70, 0.8)",
            stroke: "rgba(150, 200, 150, 1)",
            strokeWidth: 2,
        }),
        padding: 8,
        child: uiText({
            content: partName,
            textStyle: subTitleTextStyle,
        }),
        onTap: onSelect,
    });
};

const createAnimationButton = (name: string) => {
    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        background: boxBackground({
            fill: "rgba(50, 100, 150, 0.8)",
            stroke: "rgba(100, 150, 200, 1)",
            strokeWidth: 2,
        }),
        pressedBackground: boxBackground({
            fill: "rgba(30, 70, 120, 0.8)",
            stroke: "rgba(100, 150, 200, 1)",
            strokeWidth: 2,
        }),
        padding: 8,
        child: uiText({
            content: name,
            textStyle: subTitleTextStyle,
        }),
        onTap: () => {
            console.log("Export clicked!");
        },
    });
};

const createPartItemLayerBox = () =>
    uiBox({
        width: 80,
        height: 80,
        background: boxBackground({
            fill: "rgba(50, 50, 50, 0.8)",
            stroke: "rgba(100, 100, 100, 1)",
            strokeWidth: 2,
        }),
        child: uiStack({
            children: [
                uiButton({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    background: boxBackground({
                        fill: "rgba(150, 50, 50, 0.8)",
                        stroke: "rgba(200, 0, 100, 1)",
                        strokeWidth: 2,
                    }),
                    pressedBackground: boxBackground({
                        fill: "rgba(50, 0, 50, 0.8)",
                        stroke: "rgba(100, 10, 50, 1)",
                        strokeWidth: 2,
                    }),
                    padding: 2,
                    child: uiText({
                        content: "X",
                        textStyle: subTitleTextStyle,
                    }),
                    onTap: () => {
                        console.log("Export clicked!");
                    },
                }),
            ],
            alignment: uiAlignment.topRight,
            width: fillUiSize,
            height: fillUiSize,
        }),
    });

const createGridItem = () =>
    uiBox({
        width: 40,
        height: 40,
        background: boxBackground({
            stroke: "rgba(100, 100, 100, 1)",
            strokeWidth: 1,
            fill: "rgba(50, 50, 50, 0.8)",
        }),
    });

function getPartItems(): ComponentDescriptor[] {
    const parts: ComponentDescriptor[] = [];
    for (let i = 0; i < 10; i++) {
        parts.push(createGridItem());
    }
    return parts;
}

type CharacterPreviewProps = {
    chest: string;
};

const CharacterPreview = createComponent<CharacterPreviewProps>(
    ({ props, withDraw }) => {
        withDraw((scope, region) => {
            // Generate the sprite sheet with the current chest color
            const generatedSprite = buildSpriteSheet(scope, props.chest);

            scope.drawScreenSpaceSprite({
                x: region.x,
                y: region.y,
                targetWidth: region.width,
                targetHeight: region.height,
                sprite: generatedSprite,
            });
        });

        return sized(256, 256);
    },
);

/**
 * Main UI component for the character builder
 * Manages the layout and state for part selection and options
 */
export const CharacterBuilderUI = createComponent(({ withState }) => {
    const [selectedPart, setSelectedPart] = withState<string>("Chest");
    const [selectedAnimation, setSelectedAnimation] = withState<string>(
        characterPartFrames[0].animationName,
    );
    const bodyParts = ["Chest", "Feet", "Pants", "Hat", "Equipment"];

    return uiColumn({
        width: fillUiSize,
        height: fillUiSize,

        children: [
            // Top bar
            uiBox({
                width: fillUiSize,
                height: 60,
                background: colorBackground("rgba(0, 0, 0, 0.8)"),
                child: uiText({
                    content: "Character Builder",
                    textStyle: titleTextStyle,
                }),
                padding: 16,
            }),

            // Main content area
            uiRow({
                width: fillUiSize,
                height: fillUiSize,
                children: [
                    // Left panel - part selection
                    uiBox({
                        width: 210,
                        height: fillUiSize,
                        background: colorBackground("rgba(20, 20, 20, 0.9)"),
                        padding: 12,
                        child: uiColumn({
                            gap: 8,
                            children: [
                                uiText({
                                    content: "Parts",
                                    textStyle: titleTextStyle,
                                }),
                                ...bodyParts.map((part) =>
                                    createPartButton(
                                        part,
                                        selectedPart === part,
                                        () => {
                                            console.log(
                                                `Selected part: ${part}`,
                                            );
                                            setSelectedPart(part);
                                        },
                                    ),
                                ),
                                uiBox({
                                    width: fillUiSize,
                                    height: 1,
                                    background: colorBackground("white"),
                                }),
                                uiGrid({
                                    gap: 8,
                                    width: fillUiSize,
                                    height: wrapUiSize,
                                    children: getPartItems(),
                                }),
                            ],
                        }),
                    }),

                    // Center - sprite preview area (canvas draws sprite here)
                    uiBox({
                        width: fillUiSize,
                        height: fillUiSize,
                        child: CharacterPreview({
                            chest: "red",
                        }),
                    }),

                    uiBox({
                        width: 100,
                        height: fillUiSize,
                        padding: 8,
                        alignment: uiAlignment.topCenter,
                        child: uiColumn({
                            width: fillUiSize,
                            height: wrapUiSize,
                            gap: 8,
                            children: [
                                createPartItemLayerBox(),
                                createPartItemLayerBox(),
                                createPartItemLayerBox(),
                            ],
                        }),
                    }),
                    // Right panel - options
                    uiBox({
                        width: 220,
                        height: fillUiSize,
                        background: colorBackground("rgba(20, 20, 20, 0.9)"),
                        padding: 12,
                        child: uiColumn({
                            gap: 8,
                            children: [
                                uiText({
                                    content: "Animations",
                                    textStyle: titleTextStyle,
                                }),
                                ...characterPartFrames.map((frame) =>
                                    createAnimationButton(frame.animationName),
                                ),
                            ],
                        }),
                    }),
                ],
            }),
        ],
    });
});
