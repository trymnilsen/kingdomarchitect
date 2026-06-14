import { createComponent } from "../../../../../ui/declarative/ui.ts";
import {
    UIBookLayoutPage,
    uiBookLayout,
} from "../../../../../ui/declarative/uiBookLayout.ts";
import { uiBox } from "../../../../../ui/declarative/uiBox.ts";
import { uiChip } from "../../../../../ui/declarative/uiChip.ts";
import { uiPaginatedList } from "../../../../../ui/declarative/uiPaginatedList.ts";
import { uiColumn, uiRow } from "../../../../../ui/declarative/uiSequence.ts";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.ts";
import {
    stockEntryKey,
    type StockEntry,
} from "../../../../building/stockAggregate.ts";
import type { Entity } from "../../../../entity/entity.ts";
import { stockDetailsPage } from "../../../view/stockDetailsPage.ts";
import { stockListItem } from "../../../view/stockListItem.ts";
import { uiScaffold } from "../../../view/uiScaffold.ts";

export type InventoryChip = {
    label: string;
    dismissable: boolean;
    onDismiss?: () => void;
};

export type InventoryViewProps = {
    entries: StockEntry[];
    chips: InventoryChip[];
    selectedKey: string | null;
    /** False when scoped to one inventory — hides the per-location jump list. */
    showSources: boolean;
    onSelect: (key: string) => void;
    onJump: (entity: Entity) => void;
    onEquip?: (entry: StockEntry) => void;
    onDrop?: (entry: StockEntry) => void;
};

export const inventoryView = createComponent<InventoryViewProps>(
    ({ props, withState }) => {
        const [currentPage, setCurrentPage] = withState<UIBookLayoutPage>(
            UIBookLayoutPage.Left,
        );

        const selectedEntry =
            props.entries.find(
                (entry) => stockEntryKey(entry) === props.selectedKey,
            ) ?? props.entries[0];
        const selectedKey = selectedEntry ? stockEntryKey(selectedEntry) : null;

        const listItems = props.entries.map((entry) => {
            const key = stockEntryKey(entry);
            return stockListItem({
                entry,
                isSelected: key === selectedKey,
                onTap: () => {
                    props.onSelect(key);
                    setCurrentPage(UIBookLayoutPage.Right);
                },
            });
        });

        const list = uiPaginatedList({
            items: listItems,
            width: fillUiSize,
            height: fillUiSize,
            gap: 4,
        });

        const chipRow = uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            gap: 8,
            children: props.chips.map((chip) =>
                uiChip({
                    label: chip.label,
                    dismissable: chip.dismissable,
                    onDismiss: chip.onDismiss,
                }),
            ),
        });

        const leftPage = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 16,
            child: uiColumn({
                width: fillUiSize,
                height: fillUiSize,
                gap: 8,
                children: props.chips.length > 0 ? [chipRow, list] : [list],
            }),
        });

        const rightPage = stockDetailsPage({
            entry: selectedEntry,
            onJump: props.onJump,
            showSources: props.showSources,
        });

        const book = uiBookLayout({
            leftPage,
            rightPage,
            currentPage,
            onPageChange: (page) => setCurrentPage(page),
        });

        const onEquip = props.onEquip;
        const onDrop = props.onDrop;

        // Each action only appears when its callback is provided, so equip mode
        // (which omits onDrop) shows just "equip".
        return uiScaffold({
            content: book,
            leftButtons: [
                ...(onEquip
                    ? [
                          {
                              text: "equip",
                              onClick: () => {
                                  if (selectedEntry) {
                                      onEquip(selectedEntry);
                                  }
                              },
                          },
                      ]
                    : []),
                ...(onDrop
                    ? [
                          {
                              text: "drop",
                              onClick: () => {
                                  if (selectedEntry) {
                                      onDrop(selectedEntry);
                                  }
                              },
                          },
                      ]
                    : []),
            ],
        });
    },
    { displayName: "InventoryView" },
);
