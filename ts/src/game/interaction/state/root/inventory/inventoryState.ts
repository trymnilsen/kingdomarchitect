import { Sprite2, sprites2 } from "../../../../../asset/sprite.js";
import { allSides, symmetricSides } from "../../../../../common/sides.js";
import {
    InventoryItem,
    ItemTag,
} from "../../../../../data/inventory/inventoryItem.js";
import { InventoryItemList } from "../../../../../data/inventory/inventoryItemQuantity.js";
import { UIThemeType, bookInkColor } from "../../../../../ui/color.js";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { ColumnChild, uiColumn } from "../../../../../ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../../../ui/dsl/uiImageDsl.js";
import { uiText } from "../../../../../ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../../ui/uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.js";
import { UIView } from "../../../../../ui/uiView.js";
import { UIFlowGrid } from "../../../../../ui/view/uiFlowGrid.js";
import { UIMasterDetails } from "../../../../../ui/view/uiMasterDetail.js";
import { OpenBookUIBackground } from "../../../../../ui/visual/bookBackground.js";
import { InventoryComponent } from "../../../../world/component/inventory/inventoryComponent.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarItem } from "../../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../../common/alertMessageState.js";
import { EquipItemState } from "./equipItemState.js";
import { UIInventoryGridItem } from "./uiInventoryGridItem.js";

export class InventoryState extends InteractionState {
    private _masterDetailsView!: UIMasterDetails;
    private _selectedGridItemView: UIInventoryGridItem | undefined;
    private _scaffold: UIActionbarScaffold | null = null;
    private _items: InventoryItemList = [];
    private _activeItem: number = 0;

    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
    }

    override onActive(): void {
        this.getInventoryItemList();
        const actions = this.getActionbarItems();

        const gridView = this.getMasterGridView();
        const detailsView = this.getDetailsView(0);

        const masterView = uiBox({
            width: 300,
            height: 400,
            padding: allSides(32),
            children: [gridView],
        });

        this._masterDetailsView = new UIMasterDetails(masterView, detailsView, {
            width: fillUiSize,
            height: fillUiSize,
        });

        this._masterDetailsView.dualBackground = new OpenBookUIBackground();
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            children: [this._masterDetailsView],
        });

        const scaffoldView = new UIActionbarScaffold(contentView, actions, [], {
            width: fillUiSize,
            height: fillUiSize,
        });

        this._scaffold = scaffoldView;
        this.view = scaffoldView;
    }

    private itemSelected(index: number, view: UIInventoryGridItem) {
        this._masterDetailsView.showDetails(this.getDetailsView(index));
        if (this._selectedGridItemView) {
            this._selectedGridItemView.isSelected = false;
        }
        this._activeItem = index;
        this._selectedGridItemView = view;
        view.isSelected = true;
        const items = this.getActionbarItems();
        this._scaffold?.setLeftMenu(items);
    }

    private getInventoryItemList() {
        const inventoryComponent =
            this.context.world.rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component on root entity");
        }

        this._items = inventoryComponent.items;
    }

    private getMasterGridView(): UIView {
        const gridView = new UIFlowGrid({
            width: fillUiSize,
            height: fillUiSize,
        });
        gridView.gridItemSize = 50;

        for (let i = 0; i < 24; i++) {
            const inventoryItem = this._items[i];
            if (!!inventoryItem) {
                const isSelected = i == 0;
                const gridItem = new UIInventoryGridItem(
                    inventoryItem.item.asset,
                    isSelected,
                    UIThemeType.Book
                );
                gridItem.id = inventoryItem.item.name;

                if (isSelected) {
                    this._selectedGridItemView = gridItem;
                }

                gridItem.onTapCallback = () => {
                    this.itemSelected(i, gridItem);
                };
                gridView.addView(gridItem);
            } else {
                gridView.addView(
                    uiBox({
                        width: fillUiSize,
                        height: fillUiSize,
                        background: ninePatchBackground({
                            sprite: sprites2.book_grid_item,
                            sides: allSides(8),
                            scale: 1,
                        }),
                    })
                );
            }
        }

        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.topLeft,
            children: [gridView],
        });
    }

    private getDetailsView(index: number): UIView {
        const inventoryItem = this._items[index];
        const description: (item: Readonly<InventoryItem>) => ColumnChild[] = (
            item
        ) => {
            if (item.hint) {
                return [
                    {
                        child: uiText({
                            alignment: uiAlignment.centerLeft,
                            text: `description:`,
                            style: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 16,
                            },
                            width: fillUiSize,
                            height: wrapUiSize,
                        }),
                    },
                    {
                        child: uiText({
                            alignment: uiAlignment.centerLeft,
                            text: inventoryItem.item.hint || "",
                            style: {
                                color: bookInkColor,
                                font: "Silkscreen",
                                size: 16,
                            },
                            width: fillUiSize,
                            height: wrapUiSize,
                        }),
                    },
                ];
            } else {
                return [];
            }
        };
        if (!!inventoryItem) {
            return uiBox({
                width: 300,
                height: 400,
                padding: {
                    bottom: 32,
                    left: 24,
                    top: 32,
                    right: 40,
                },
                children: [
                    uiColumn({
                        width: fillUiSize,
                        height: fillUiSize,
                        children: [
                            {
                                child: uiBox({
                                    height: 180,
                                    width: fillUiSize,
                                    background: ninePatchBackground({
                                        sprite: sprites2.book_grid_item,
                                        sides: allSides(8),
                                        scale: 1,
                                    }),
                                    children: [
                                        uiImage({
                                            height: 64,
                                            width: 64,
                                            image: spriteImageSource(
                                                inventoryItem.item.asset
                                            ),
                                        }),
                                    ],
                                }),
                            },
                            {
                                child: uiText({
                                    padding: symmetricSides(0, 8),
                                    text: inventoryItem.item.name,
                                    style: {
                                        color: bookInkColor,
                                        font: "Silkscreen",
                                        size: 20,
                                    },
                                    width: fillUiSize,
                                    height: wrapUiSize,
                                }),
                            },
                            {
                                child: uiText({
                                    alignment: uiAlignment.centerLeft,
                                    text: `amount: ${inventoryItem.amount}`,
                                    style: {
                                        color: bookInkColor,
                                        font: "Silkscreen",
                                        size: 16,
                                    },
                                    width: fillUiSize,
                                    height: wrapUiSize,
                                }),
                            },
                            {
                                child: uiText({
                                    alignment: uiAlignment.centerLeft,
                                    text: `value: 50`,
                                    style: {
                                        color: bookInkColor,
                                        font: "Silkscreen",
                                        size: 16,
                                    },
                                    width: fillUiSize,
                                    height: wrapUiSize,
                                }),
                            },
                            ...description(inventoryItem.item),
                        ],
                    }),
                ],
            });
        } else {
            return uiBox({
                width: 300,
                height: 400,
                padding: {
                    bottom: 32,
                    left: 24,
                    top: 32,
                    right: 40,
                },
                children: [
                    uiText({
                        padding: symmetricSides(0, 8),
                        text: "Inventory empty",
                        style: {
                            color: bookInkColor,
                            font: "Silkscreen",
                            size: 20,
                        },
                        width: fillUiSize,
                        height: wrapUiSize,
                    }),
                ],
            });
        }
    }

    private getActionbarItems(): UIActionbarItem[] {
        if (this._items.length == 0) {
            return [
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ];
        } else {
            const actions: UIActionbarItem[] = [];

            actions.push({
                text: "Drop",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Ops", "not implemented")
                    );
                },
            });

            const activeItem = this._items[this._activeItem];
            if (
                activeItem &&
                activeItem.item.tag?.some((tag) => tag === ItemTag.SkillGear)
            ) {
                actions.push({
                    text: "Equip",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.push(
                            new EquipItemState(activeItem.item)
                        );
                    },
                });
            }

            actions.push({
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.pop(null);
                },
            });

            return actions;
        }
    }
}

export function getAssetImage(index: number): Sprite2 | null {
    switch (index) {
        case 0:
            return sprites2.wood_resource;
        case 1:
            return sprites2.bag_of_glitter;
        case 2:
            return sprites2.gem_resource;
        case 3:
            return sprites2.stone_resource;
        default:
            return null;
    }
}
