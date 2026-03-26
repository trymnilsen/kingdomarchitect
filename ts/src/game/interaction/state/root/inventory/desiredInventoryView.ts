import { allSides } from "../../../../../common/sides.ts";
import { spriteRefs } from "../../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../../ui/color.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../../ui/declarative/uiButton.ts";
import { uiImage } from "../../../../../ui/declarative/uiImage.ts";
import {
    CrossAxisAlignment,
    uiColumn,
    uiRow,
} from "../../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../../ui/declarative/uiText.ts";
import { ninePatchBackground } from "../../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.ts";
import type {
    DesiredInventoryComponent,
    DesiredInventoryEntry,
} from "../../../../component/desiredInventoryComponent.ts";
import {
    getInventoryItemById,
    isFood,
} from "../../../../../data/inventory/inventoryItemHelpers.ts";
import { resources } from "../../../../../data/inventory/items/resources.ts";
import type { InventoryItem } from "../../../../../data/inventory/inventoryItem.ts";

const foodItems = (resources as readonly InventoryItem[]).filter(isFood);

const bookTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 12,
} as const;

export type DesiredInventoryLeftPageProps = {
    desired: DesiredInventoryComponent;
    selectedIndex: number | null;
    onSelect: (index: number | null) => void;
};

export const desiredInventoryLeftPage =
    createComponent<DesiredInventoryLeftPageProps>(
        ({ props }) => {
            const entries = props.desired.items;
            const slotCount = Math.max(8, entries.length + 1);
            const rows: ComponentDescriptor[] = [];

            for (let i = 0; i < slotCount; i++) {
                const entry = entries[i];
                const isSelected = i === props.selectedIndex;
                const bg = ninePatchBackground({
                    sprite: isSelected
                        ? spriteRefs.book_grid_item_focused
                        : spriteRefs.book_grid_item,
                    sides: allSides(8),
                    scale: 1,
                });

                if (entry) {
                    const item = getInventoryItemById(entry.itemId);
                    rows.push(
                        uiButton({
                            width: fillUiSize,
                            height: 40,
                            background: bg,
                            onTap: () => props.onSelect(i),
                            child: uiRow({
                                width: fillUiSize,
                                height: wrapUiSize,
                                gap: 8,
                                crossAxisAlignment: CrossAxisAlignment.Center,
                                children: [
                                    uiImage({
                                        sprite:
                                            item?.asset ??
                                            spriteRefs.empty_sprite,
                                        width: 24,
                                        height: 24,
                                    }),
                                    uiText({
                                        content: item?.name ?? entry.itemId,
                                        textStyle: bookTextStyle,
                                    }),
                                    uiText({
                                        content: `×${entry.amount}`,
                                        textStyle: bookTextStyle,
                                    }),
                                ],
                            }),
                        }),
                    );
                } else {
                    rows.push(
                        uiButton({
                            width: fillUiSize,
                            height: 40,
                            background: bg,
                            onTap: () =>
                                props.onSelect(
                                    i === props.selectedIndex ? null : i,
                                ),
                            child: uiText({
                                content: "empty slot",
                                textStyle: bookTextStyle,
                            }),
                        }),
                    );
                }
            }

            return uiBox({
                width: fillUiSize,
                height: fillUiSize,
                padding: 16,
                child: uiColumn({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: 6,
                    children: rows,
                }),
            });
        },
        { displayName: "DesiredInventoryLeftPage" },
    );

export type DesiredInventoryRightPageProps = {
    desired: DesiredInventoryComponent;
    selectedIndex: number | null;
    onUpdate: (items: DesiredInventoryEntry[]) => void;
};

export const desiredInventoryRightPage =
    createComponent<DesiredInventoryRightPageProps>(
        ({ props }) => {
            const entry =
                props.selectedIndex !== null
                    ? props.desired.items[props.selectedIndex]
                    : undefined;

            if (entry) {
                return renderEntryEditor(
                    entry,
                    props.selectedIndex!,
                    props.desired,
                    props.onUpdate,
                );
            }
            return renderFoodPicker(props.desired, props.onUpdate);
        },
        { displayName: "DesiredInventoryRightPage" },
    );

function renderEntryEditor(
    entry: DesiredInventoryEntry,
    selectedIndex: number,
    desired: DesiredInventoryComponent,
    onUpdate: (items: DesiredInventoryEntry[]) => void,
): ComponentDescriptor {
    const item = getInventoryItemById(entry.itemId);

    function setAmount(delta: number) {
        const newAmount = Math.max(1, entry.amount + delta);
        onUpdate(
            desired.items.map((e, i) =>
                i === selectedIndex ? { ...e, amount: newAmount } : e,
            ),
        );
    }

    const buttonBg = ninePatchBackground({
        sprite: spriteRefs.book_border,
        sides: allSides(8),
        scale: 1,
    });

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 12,
            crossAxisAlignment: CrossAxisAlignment.Center,
            children: [
                uiBox({
                    width: 80,
                    height: 80,
                    background: ninePatchBackground({
                        sprite: spriteRefs.book_grid_item,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiImage({
                        sprite: item?.asset ?? spriteRefs.empty_sprite,
                        width: 48,
                        height: 48,
                    }),
                }),
                uiText({
                    content: item?.name ?? entry.itemId,
                    textStyle: {
                        color: bookInkColor,
                        font: "Silkscreen",
                        size: 16,
                    },
                }),
                uiRow({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    gap: 8,
                    crossAxisAlignment: CrossAxisAlignment.Center,
                    children: [
                        uiButton({
                            width: 32,
                            height: 32,
                            background: buttonBg,
                            onTap: () => setAmount(-1),
                            child: uiText({
                                content: "-",
                                textStyle: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 16,
                                },
                            }),
                        }),
                        uiText({
                            content: `${entry.amount}`,
                            textStyle: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 20,
                            },
                        }),
                        uiButton({
                            width: 32,
                            height: 32,
                            background: buttonBg,
                            onTap: () => setAmount(1),
                            child: uiText({
                                content: "+",
                                textStyle: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 16,
                                },
                            }),
                        }),
                    ],
                }),
                uiButton({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    padding: 8,
                    background: buttonBg,
                    onTap: () =>
                        onUpdate(
                            desired.items.filter((_, i) => i !== selectedIndex),
                        ),
                    child: uiText({
                        content: "Remove",
                        textStyle: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 14,
                        },
                    }),
                }),
            ],
        }),
    });
}

function renderFoodPicker(
    desired: DesiredInventoryComponent,
    onUpdate: (items: DesiredInventoryEntry[]) => void,
): ComponentDescriptor {
    const existingIds = new Set(desired.items.map((e) => e.itemId));
    const addable = foodItems.filter((food) => !existingIds.has(food.id));

    const rows: ComponentDescriptor[] = addable.map((food) =>
        uiButton({
            width: fillUiSize,
            height: 36,
            background: ninePatchBackground({
                sprite: spriteRefs.book_grid_item,
                sides: allSides(8),
                scale: 1,
            }),
            onTap: () =>
                onUpdate([...desired.items, { itemId: food.id, amount: 1 }]),
            child: uiRow({
                width: fillUiSize,
                height: wrapUiSize,
                gap: 8,
                crossAxisAlignment: CrossAxisAlignment.Center,
                children: [
                    uiImage({
                        sprite: food.asset,
                        width: 20,
                        height: 20,
                    }),
                    uiText({
                        content: food.name,
                        textStyle: bookTextStyle,
                    }),
                ],
            }),
        }),
    );

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 4,
            children:
                rows.length > 0
                    ? [
                          uiText({
                              content: "Add food:",
                              textStyle: {
                                  color: bookInkColor,
                                  font: "Silkscreen",
                                  size: 14,
                              },
                          }),
                          ...rows,
                      ]
                    : [
                          uiText({
                              content: "All food items\nalready added",
                              textStyle: {
                                  color: bookInkColor,
                                  font: "Silkscreen",
                                  size: 14,
                              },
                          }),
                      ],
        }),
    });
}
