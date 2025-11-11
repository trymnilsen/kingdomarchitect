import { createComponent } from "../ui/declarative/ui.js";
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
import { sprites2 } from "../asset/sprite.js";

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

/**
 * Main UI component for the character builder
 * Manages the layout and state for part selection and options
 */
export const CharacterBuilderUI = createComponent(({ withState }) => {
    const [selectedPart, setSelectedPart] = withState<string>("Body");

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
                        width: 200,
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
                                uiSpace({ height: 8 }),
                                createPartButton(
                                    "Body",
                                    selectedPart === "Body",
                                    () => {
                                        console.log(`Selected part: Body`);
                                        setSelectedPart("Body");
                                    },
                                ),
                                createPartButton(
                                    "Head",
                                    selectedPart === "Head",
                                    () => {
                                        console.log(`Selected part: Head`);
                                        setSelectedPart("Head");
                                    },
                                ),
                                createPartButton(
                                    "Hair",
                                    selectedPart === "Hair",
                                    () => {
                                        console.log(`Selected part: Hair`);
                                        setSelectedPart("Hair");
                                    },
                                ),
                                createPartButton(
                                    "Outfit",
                                    selectedPart === "Outfit",
                                    () => {
                                        console.log(`Selected part: Outfit`);
                                        setSelectedPart("Outfit");
                                    },
                                ),
                            ],
                        }),
                    }),

                    // Center - sprite preview area (canvas draws sprite here)
                    uiBox({
                        width: fillUiSize,
                        height: fillUiSize,
                        //background: colorBackground("red"),
                        child: uiImage({
                            width: 256,
                            height: 256,
                            sprite: sprites2.bowman,
                        }),
                    }),

                    // Right panel - options
                    uiBox({
                        width: 200,
                        height: fillUiSize,
                        background: colorBackground("rgba(20, 20, 20, 0.9)"),
                        padding: 12,
                        child: uiColumn({
                            gap: 8,
                            children: [
                                uiText({
                                    content: "Options",
                                    textStyle: titleTextStyle,
                                }),
                                uiSpace({ height: 8 }),
                                uiButton({
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
                                        content: "Export",
                                        textStyle: subTitleTextStyle,
                                    }),
                                    onTap: () => {
                                        console.log("Export clicked!");
                                    },
                                }),
                                uiButton({
                                    width: fillUiSize,
                                    height: wrapUiSize,
                                    background: boxBackground({
                                        fill: "rgba(150, 50, 50, 0.8)",
                                        stroke: "rgba(200, 100, 100, 1)",
                                        strokeWidth: 2,
                                    }),
                                    pressedBackground: boxBackground({
                                        fill: "rgba(120, 30, 30, 0.8)",
                                        stroke: "rgba(200, 100, 100, 1)",
                                        strokeWidth: 2,
                                    }),
                                    padding: 8,
                                    child: uiText({
                                        content: "Reset",
                                        textStyle: subTitleTextStyle,
                                    }),
                                    onTap: () => {
                                        console.log("Reset clicked!");
                                        setSelectedPart("Body");
                                    },
                                }),
                            ],
                        }),
                    }),
                ],
            }),
        ],
    });
});
