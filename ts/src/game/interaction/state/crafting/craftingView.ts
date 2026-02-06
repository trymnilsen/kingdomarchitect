import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import type { CraftingRecipe } from "../../../../data/crafting/craftingRecipe.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { uiBookLayout } from "../../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiColumn, uiRow } from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { allSides } from "../../../../common/sides.ts";

const bookTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

const bookSubtitleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

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

type RecipeListItemProps = {
    recipe: CraftingRecipe;
    isSelected: boolean;
    onTap: () => void;
};

const recipeListItem = createComponent<RecipeListItemProps>(({ props }) => {
    const backgroundSprite = props.isSelected
        ? spriteRefs.book_grid_item_focused
        : spriteRefs.book_grid_item;

    const inputSummary = props.recipe.inputs
        .map((input) => `${input.amount}x ${input.item.name}`)
        .join(", ");

    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        padding: 8,
        background: ninePatchBackground({
            sprite: backgroundSprite,
            sides: allSides(8),
            scale: 1,
        }),
        onTap: props.onTap,
        child: uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: [
                uiImage({
                    sprite: props.recipe.icon,
                    width: 32,
                    height: 32,
                }),
                uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        uiText({
                            content: props.recipe.name,
                            textStyle: bookTextStyle,
                        }),
                        uiText({
                            content: inputSummary,
                            textStyle: bookSubtitleStyle,
                        }),
                    ],
                }),
            ],
        }),
    });
});

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
                return recipeListItem({
                    recipe,
                    isSelected,
                    onTap: () => {
                        setSelectedIndex(i);
                        props.onRecipeSelected(i);
                    },
                });
            },
        );

        const leftPage = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 8,
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
