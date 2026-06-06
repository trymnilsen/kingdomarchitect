import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../ui/declarative/uiImage.ts";
import { uiColumn, uiRow } from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import {
    getAvailableCrops,
    type CropDefinition,
    type CropId,
} from "../../../../data/crop/cropDefinitions.ts";

const bookTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

const bookTitleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 20,
};

const bookSubtitleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
};

export type CropSelectionViewProps = {
    currentCropId: CropId;
    selectedCropIndex: number;
    onCropSelected: (index: number) => void;
    onAssign: (cropId: CropId) => void;
    onCancel: () => void;
};

type CropListItemProps = {
    crop: CropDefinition;
    isSelected: boolean;
    isCurrent: boolean;
    onTap: () => void;
};

const cropListItem = createComponent<CropListItemProps>(({ props }) => {
    const backgroundSprite = props.isSelected
        ? spriteRefs.book_grid_item_focused
        : spriteRefs.book_grid_item;

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
                    sprite: props.crop.icon,
                    width: 32,
                    height: 32,
                }),
                uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        uiText({
                            content:
                                props.crop.name +
                                (props.isCurrent ? " (current)" : ""),
                            textStyle: bookTextStyle,
                        }),
                        uiText({
                            content: props.crop.subtitle,
                            textStyle: bookSubtitleStyle,
                        }),
                    ],
                }),
            ],
        }),
    });
});

function createMasterView(
    crops: CropDefinition[],
    currentCropId: CropId,
    selectedIndex: number,
    onCropSelect: (index: number) => void,
): ComponentDescriptor {
    const listItems = crops.map((crop, index) =>
        cropListItem({
            crop,
            isSelected: index === selectedIndex,
            isCurrent: crop.cropId === currentCropId,
            onTap: () => onCropSelect(index),
        }),
    );

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            gap: 4,
            children: listItems,
        }),
    });
}

function createDetailsView(crop: CropDefinition): ComponentDescriptor {
    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: [
                uiBox({
                    width: fillUiSize,
                    height: 100,
                    background: ninePatchBackground({
                        sprite: spriteRefs.book_grid_item,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiImage({
                        sprite: crop.icon,
                        width: 64,
                        height: 64,
                    }),
                }),
                uiText({
                    content: crop.name,
                    textStyle: bookTitleStyle,
                }),
                uiText({
                    content: crop.subtitle,
                    textStyle: bookTextStyle,
                }),
                uiText({
                    content: crop.description,
                    textStyle: bookSubtitleStyle,
                }),
            ],
        }),
    });
}

export const cropSelectionView = createComponent<CropSelectionViewProps>(
    ({ props, withState }) => {
        const crops = getAvailableCrops();
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedCropIndex,
        );

        const masterView = createMasterView(
            crops,
            props.currentCropId,
            selectedIndex,
            (index: number) => {
                setSelectedIndex(index);
                props.onCropSelected(index);
            },
        );

        const detailsView = createDetailsView(crops[selectedIndex]);

        return uiScaffold({
            content: uiBookLayout({
                leftPage: masterView,
                rightPage: detailsView,
            }),
            leftButtons: [
                {
                    text: "Assign",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        props.onAssign(crops[selectedIndex].cropId);
                    },
                },
                {
                    text: "Cancel",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => props.onCancel(),
                },
            ],
        });
    },
    { displayName: "CropSelectionView" },
);
