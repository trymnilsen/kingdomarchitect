import { subTitleTextStyle } from "../../rendering/text/textStyle.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../ui/declarative/ui.ts";
import { uiBox } from "../../ui/declarative/uiBox.ts";
import { uiButton } from "../../ui/declarative/uiButton.ts";
import { uiStack } from "../../ui/declarative/uiStack.ts";
import { uiText } from "../../ui/declarative/uiText.ts";
import { uiAlignment } from "../../ui/uiAlignment.ts";
import { boxBackground } from "../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../ui/uiSize.ts";
import { COLORS, LAYOUT } from "./characterBuilderConstants.ts";

/**
 * Creates a part selection button with selected/unselected states
 */
export const createPartButton = (
    partName: string,
    isSelected: boolean,
    onSelect: () => void,
) => {
    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        background: boxBackground({
            fill: isSelected
                ? COLORS.PART_BUTTON_SELECTED
                : COLORS.PART_BUTTON_DEFAULT,
            stroke: isSelected
                ? COLORS.PART_BUTTON_BORDER_SELECTED
                : COLORS.PART_BUTTON_BORDER,
            strokeWidth: 2,
        }),
        pressedBackground: boxBackground({
            fill: COLORS.PART_BUTTON_PRESSED,
            stroke: COLORS.PART_BUTTON_BORDER_SELECTED,
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
 * Creates a primary action button (blue themed)
 */
export const createPrimaryButton = (
    name: string,
    onTap: () => void,
    selected?: boolean,
    disabled?: boolean,
) => {
    const isDisabled = disabled ?? false;
    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        background: boxBackground({
            fill: isDisabled
                ? COLORS.PRIMARY_BUTTON_DISABLED
                : selected
                  ? COLORS.PRIMARY_BUTTON_SELECTED
                  : COLORS.PRIMARY_BUTTON_DEFAULT,
            stroke: isDisabled
                ? COLORS.PRIMARY_BUTTON_DISABLED_BORDER
                : selected
                  ? COLORS.PRIMARY_BUTTON_BORDER_SELECTED
                  : COLORS.PRIMARY_BUTTON_BORDER,
            strokeWidth: 2,
        }),
        pressedBackground: boxBackground({
            fill: isDisabled
                ? COLORS.PRIMARY_BUTTON_DISABLED
                : COLORS.PRIMARY_BUTTON_PRESSED,
            stroke: isDisabled
                ? COLORS.PRIMARY_BUTTON_DISABLED_BORDER
                : COLORS.PRIMARY_BUTTON_BORDER,
            strokeWidth: 2,
        }),
        padding: 8,
        child: uiText({
            content: name,
            textStyle: subTitleTextStyle,
        }),
        onTap: isDisabled ? () => {} : onTap,
    });
};

/**
 * Creates an animation selection button
 */
export const createAnimationButton = (
    animationName: string,
    isSelected: boolean,
    onSelect: () => void,
) => {
    return createPrimaryButton(animationName, onSelect, isSelected);
};

type GridItemProps = {
    color?: string;
    onClick: (item: string | undefined) => void;
};

/**
 * Grid item component for color selection
 */
export const ColorGridItem = createComponent<GridItemProps>(
    ({ props, withGesture }) => {
        withGesture("tap", () => {
            props.onClick(props.color);
            return true;
        });

        return uiBox({
            width: LAYOUT.COLOR_SWATCH_SIZE,
            height: LAYOUT.COLOR_SWATCH_SIZE,
            background: boxBackground({
                stroke: COLORS.PART_BUTTON_BORDER,
                strokeWidth: 1,
                fill: props.color ?? COLORS.BACKGROUND_BLACK,
            }),
        });
    },
);

/**
 * Generates grid items for color selection
 */
export function createColorGridItems(
    colors: readonly string[],
    onClick: (color: string | undefined) => void,
): ComponentDescriptor[] {
    return [
        ColorGridItem({ color: undefined, onClick }),
        ...colors.map((color) => ColorGridItem({ color, onClick })),
    ];
}

/**
 * Creates a layer box with remove button for managing character parts
 */
export const createPartLayerBox = (onRemove?: () => void) =>
    uiBox({
        width: LAYOUT.LAYER_BOX_SIZE - 20,
        height: LAYOUT.LAYER_BOX_SIZE - 20,
        background: boxBackground({
            fill: COLORS.LAYER_BOX_FILL,
            stroke: COLORS.LAYER_BOX_BORDER,
            strokeWidth: 2,
        }),
        child: uiStack({
            children: [
                uiButton({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    background: boxBackground({
                        fill: COLORS.DANGER_BUTTON_FILL,
                        stroke: COLORS.DANGER_BUTTON_BORDER,
                        strokeWidth: 2,
                    }),
                    pressedBackground: boxBackground({
                        fill: COLORS.DANGER_BUTTON_PRESSED,
                        stroke: COLORS.DANGER_BUTTON_BORDER_PRESSED,
                        strokeWidth: 2,
                    }),
                    padding: 2,
                    child: uiText({
                        content: "X",
                        textStyle: subTitleTextStyle,
                    }),
                    onTap: () => {
                        if (onRemove) {
                            onRemove();
                        } else {
                            console.log("Remove layer clicked");
                        }
                    },
                }),
            ],
            alignment: uiAlignment.topRight,
            width: fillUiSize,
            height: fillUiSize,
        }),
    });
