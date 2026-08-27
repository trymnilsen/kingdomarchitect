import { allSides } from "../../../common/sides.ts";
import type { SpriteRef } from "../../../asset/sprite.ts";
import { spriteRefs } from "../../../asset/sprite.ts";
import { bookInkColor } from "../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../ui/declarative/uiImage.ts";
import { uiColumn, uiRow } from "../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../ui/uiSize.ts";
import { uiScaffold } from "./uiScaffold.ts";

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

/**
 * One pickable thing in the book. Crop and role definitions both satisfy this
 * shape, so they can be handed to the view as they are.
 */
export type BookSelectionEntry = {
    name: string;
    subtitle: string;
    description: string;
    icon: SpriteRef;
};

export type BookSelectionViewProps = {
    entries: BookSelectionEntry[];
    /** Entry already assigned to the subject, marked "(current)". -1 for none. */
    currentIndex: number;
    selectedIndex: number;
    onSelected: (index: number) => void;
    onAssign: (index: number) => void;
    onCancel: () => void;
};

type BookListItemProps = {
    entry: BookSelectionEntry;
    isSelected: boolean;
    isCurrent: boolean;
    onTap: () => void;
};

const bookListItem = createComponent<BookListItemProps>(({ props }) => {
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
                    sprite: props.entry.icon,
                    width: 32,
                    height: 32,
                }),
                uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        uiText({
                            content:
                                props.entry.name +
                                (props.isCurrent ? " (current)" : ""),
                            textStyle: bookTextStyle,
                        }),
                        uiText({
                            content: props.entry.subtitle,
                            textStyle: bookSubtitleStyle,
                        }),
                    ],
                }),
            ],
        }),
    });
});

function createMasterView(
    entries: BookSelectionEntry[],
    currentIndex: number,
    selectedIndex: number,
    onSelect: (index: number) => void,
): ComponentDescriptor {
    const listItems = entries.map((entry, index) =>
        bookListItem({
            entry,
            isSelected: index === selectedIndex,
            isCurrent: index === currentIndex,
            onTap: () => onSelect(index),
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

function createDetailsView(entry: BookSelectionEntry): ComponentDescriptor {
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
                        sprite: entry.icon,
                        width: 64,
                        height: 64,
                    }),
                }),
                uiText({
                    content: entry.name,
                    textStyle: bookTitleStyle,
                }),
                uiText({
                    content: entry.subtitle,
                    textStyle: bookTextStyle,
                }),
                uiText({
                    content: entry.description,
                    textStyle: bookSubtitleStyle,
                }),
            ],
        }),
    });
}

/**
 * Master/detail picker rendered as an open book: the list on the left page,
 * the selected entry described on the right. Crop and role selection both use
 * it, and the caller maps the chosen index back to its own domain value.
 */
export const bookSelectionView = createComponent<BookSelectionViewProps>(
    ({ props, withState }) => {
        const [selectedIndex, setSelectedIndex] = withState(
            props.selectedIndex,
        );

        const masterView = createMasterView(
            props.entries,
            props.currentIndex,
            selectedIndex,
            (index: number) => {
                setSelectedIndex(index);
                props.onSelected(index);
            },
        );

        const detailsView = createDetailsView(props.entries[selectedIndex]);

        return uiScaffold({
            content: uiBookLayout({
                leftPage: masterView,
                rightPage: detailsView,
            }),
            leftButtons: [
                {
                    text: "Assign",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => props.onAssign(selectedIndex),
                },
                {
                    text: "Cancel",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => props.onCancel(),
                },
            ],
        });
    },
    { displayName: "BookSelectionView" },
);
