import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.js";
import type { CraftingRecipe } from "../../../../data/crafting/craftingRecipe.js";
import { sprites2 } from "../../../../asset/sprite.js";
import { uiScaffold } from "../../view/uiScaffold.js";
import { uiBookLayout } from "../../../../ui/declarative/uiBookLayout.js";
import { uiBox } from "../../../../ui/declarative/uiBox.js";
import { uiColumn } from "../../../../ui/declarative/uiSequence.js";
import { uiText } from "../../../../ui/declarative/uiText.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { bookInkColor } from "../../../../ui/color.js";

export type CraftingViewProps = {
    recipes: readonly CraftingRecipe[];
    selectedRecipeIndex: number;
    isCrafting: boolean;
    hasCollectableItems: boolean;
    onRecipeSelected: (index: number) => void;
    onCraft: () => void;
    onCollect: () => void;
    onCancel: () => void;
};

export const craftingView = createComponent<CraftingViewProps>(
    ({ props, withState }) => {
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedRecipeIndex,
        );
        const selectedRecipe =
            selectedIndex >= 0 && selectedIndex < props.recipes.length
                ? props.recipes[selectedIndex]
                : null;

        // Build left page - list of recipes
        const recipeListItems: ComponentDescriptor[] = props.recipes.map(
            (recipe, i) => {
                const isSelected = i === selectedIndex;
                const prefix = isSelected ? "> " : "  ";
                return uiText({
                    content: `${prefix}${recipe.name}`,
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                });
            },
        );

        const leftPage = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 16,
            child: uiColumn({
                width: fillUiSize,
                height: fillUiSize,
                gap: 4,
                children: recipeListItems,
            }),
        });

        // Build right page - recipe details
        const rightPageChildren: ComponentDescriptor[] = [];
        if (selectedRecipe) {
            rightPageChildren.push(
                uiText({
                    content: selectedRecipe.name,
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 18,
                    },
                }),
            );
            rightPageChildren.push(
                uiText({
                    content: "",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            );
            rightPageChildren.push(
                uiText({
                    content: "Requires:",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            );
            for (const input of selectedRecipe.inputs) {
                rightPageChildren.push(
                    uiText({
                        content: `  ${input.amount}x ${input.item.name}`,
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 14,
                        },
                    }),
                );
            }
            rightPageChildren.push(
                uiText({
                    content: "",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            );
            rightPageChildren.push(
                uiText({
                    content: "Produces:",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            );
            for (const output of selectedRecipe.outputs) {
                rightPageChildren.push(
                    uiText({
                        content: `  ${output.amount}x ${output.item.name}`,
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 14,
                        },
                    }),
                );
            }
            rightPageChildren.push(
                uiText({
                    content: "",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            );
            rightPageChildren.push(
                uiText({
                    content: `Time: ${selectedRecipe.duration} ticks`,
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 14,
                    },
                }),
            );
        } else {
            rightPageChildren.push(
                uiText({
                    content: "Select a recipe",
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
            );
        }

        const rightPage = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 16,
            child: uiColumn({
                width: fillUiSize,
                height: fillUiSize,
                gap: 4,
                children: rightPageChildren,
            }),
        });

        // Determine button configuration
        let actionButtonText = "craft";
        let actionCallback = props.onCraft;

        if (props.isCrafting) {
            actionButtonText = "cancel";
            actionCallback = props.onCancel;
        } else if (props.hasCollectableItems) {
            actionButtonText = "collect";
            actionCallback = props.onCollect;
        }

        return uiScaffold({
            content: uiBookLayout({
                leftPage,
                rightPage,
            }),
            leftButtons: [
                {
                    text: actionButtonText,
                    onClick: actionCallback,
                },
            ],
        });
    },
    { displayName: "CraftingView" },
);
