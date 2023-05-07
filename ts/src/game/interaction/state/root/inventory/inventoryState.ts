import { Sprite2, sprites2 } from "../../../../../asset/sprite";
import { Direction } from "../../../../../common/direction";
import { allSides, symmetricSides } from "../../../../../common/sides";
import { InputAction } from "../../../../../input/inputAction";
import { UIThemeType, bookInkColor } from "../../../../../ui/color";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { ColumnChild, uiColumn } from "../../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../../ui/dsl/uiImageDsl";
import { uiText } from "../../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../../ui/uiAlignment";
import { SpriteBackground } from "../../../../../ui/uiBackground";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize";
import { UIView } from "../../../../../ui/uiView";
import { UIFlowGrid } from "../../../../../ui/view/uiFlowGrid";
import { UIMasterDetails } from "../../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../../ui/visual/bookBackground";
import { InventoryComponent } from "../../../../world/component/inventory/inventoryComponent";
import { InteractionState } from "../../../handler/interactionState";
import { InteractionStateChanger } from "../../../handler/interactionStateChanger";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold";
import { AlertMessageState } from "../../common/alertMessageState";
import { EquipItemState } from "./equipItemState";
import { UIInventoryGridItem } from "./uiInventoryGridItem";

export interface InventoryItems {
    name: string;
    asset: Sprite2;
    amount: number;
    value: number;
    hint?: string;
}

export class InventoryState extends InteractionState {
    private _masterDetailsView!: UIMasterDetails;
    private _selectedGridItemView: UIInventoryGridItem | undefined;
    private _items: InventoryItems[] = [];

    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
    }

    override onActive(): void {
        const actions: UIActionbarItem[] = [
            {
                text: "Drop",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Ops", "not implemented")
                    );
                },
            },
            {
                text: "Equip",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new EquipItemState());
                },
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.pop(null);
                },
            },
        ];
        const leftActionbar = new UIActionbar(
            actions,
            new SpriteBackground(sprites2.stone_slate_background_2x),
            UIActionbarAlignment.Left,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );
        this.getInventoryItemList();
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

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            leftActionbar,
            null,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldView;
    }

    override onInput(
        input: InputAction,
        stateChanger: InteractionStateChanger
    ): boolean {
        const view = this.view;
        if (!!view) {
            let direction: Direction | undefined;
            switch (input.value) {
                case "a":
                    direction = Direction.Left;
                    break;
                case "d":
                    direction = Direction.Right;
                    break;
                case "w":
                    direction = Direction.Up;
                    break;
                case "s":
                    direction = Direction.Down;
                    break;
                default:
                    break;
            }
            if (!!direction) {
                view.dispatchUIEvent({
                    type: "direction",
                    direction: direction,
                });
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    private itemSelected(index: number, view: UIInventoryGridItem) {
        this._masterDetailsView.showDetails(this.getDetailsView(index));
        if (this._selectedGridItemView) {
            this._selectedGridItemView.isSelected = false;
        }

        this._selectedGridItemView = view;
        view.isSelected = true;
    }

    private getInventoryItemList() {
        const inventoryComponent =
            this.context.world.rootEntity.getComponent(InventoryComponent);

        if (!inventoryComponent) {
            throw new Error("No inventory component on root entity");
        }

        const items = inventoryComponent.items;
        this._items = items.map((item) => {
            return {
                name: item.item.name,
                asset: item.item.asset,
                amount: item.amount,
                value: 5,
                hint: item.item.hint,
            };
        });
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
                    inventoryItem.asset,
                    isSelected,
                    UIThemeType.Book
                );
                gridItem.id = inventoryItem.name;

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
        const description: (item: InventoryItems) => ColumnChild[] = (item) => {
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
                            text: inventoryItem.hint || "",
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
                                                inventoryItem.asset
                                            ),
                                        }),
                                    ],
                                }),
                            },
                            {
                                child: uiText({
                                    padding: symmetricSides(0, 8),
                                    text: inventoryItem.name,
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
                                    text: `value: ${inventoryItem.value}`,
                                    style: {
                                        color: bookInkColor,
                                        font: "Silkscreen",
                                        size: 16,
                                    },
                                    width: fillUiSize,
                                    height: wrapUiSize,
                                }),
                            },
                            ...description(inventoryItem),
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
