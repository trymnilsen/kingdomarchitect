import { Sprite2, sprites2 } from "../../../../../asset/sprite";
import { Direction } from "../../../../../common/direction";
import { generateId } from "../../../../../common/idGenerator";
import { allSides, symmetricSides } from "../../../../../common/sides";
import { InputAction } from "../../../../../input/inputAction";
import { bookInkColor } from "../../../../../ui/color";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { ColumnChild, uiColumn } from "../../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../../ui/dsl/uiImageDsl";
import { uiOffset } from "../../../../../ui/dsl/uiOffsetDsl";
import { uiText } from "../../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../../ui/uiAlignment";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize";
import { UIView } from "../../../../../ui/uiView";
import { UIFlowGrid } from "../../../../../ui/view/uiFlowGrid";
import { UIMasterDetails } from "../../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../../ui/visual/bookBackground";
import { InventoryComponent } from "../../../../world/component/inventory/inventoryComponent";
import { InteractionState } from "../../../handler/interactionState";
import { InteractionStateChanger } from "../../../handler/interactionStateChanger";
import { ActionButton, getActionbarView } from "../../../view/actionbar";
import { BuildingState } from "../building/buildingState";
import { bookTabs } from "../ui/bookTabs";
import { UIInventoryGridItem } from "./uiInventoryGridItem";

const actions: ActionButton[] = [
    {
        id: "drop",
        name: "Drop",
    },
    {
        id: "equip",
        name: "Equip",
    },
    {
        id: "location",
        name: "Locate",
    },
    {
        id: "cancel",
        name: "Close",
    },
];

export interface InventoryItems {
    name: string;
    asset: Sprite2;
    amount: number;
    value: number;
    hint?: string;
}

export class InventoryState extends InteractionState {
    private _actionbar!: UIView;
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

        this._actionbar = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });
        this._actionbar.size = {
            width: fillUiSize,
            height: wrapUiSize,
        };

        this._masterDetailsView.dualBackground = new OpenBookUIBackground();

        this.view = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            children: [
                uiColumn({
                    width: fillUiSize,
                    height: fillUiSize,
                    children: [
                        {
                            weight: 1,
                            child: uiBox({
                                id: "inventoryMasterDetails",
                                width: fillUiSize,
                                height: fillUiSize,
                                padding: allSides(64),
                                children: [this._masterDetailsView],
                            }),
                        },
                        {
                            child: this._actionbar,
                        },
                    ],
                }),
            ],
        });
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

    private actionSelected(action: ActionButton) {
        console.log("Action pressed: ", action);
        if (action.id == "cancel") {
            this.context.stateChanger.pop(undefined);
        }
    }

    private getInventoryItemList() {
        const inventoryComponent =
            this.context.world.rootEntity.getComponent(InventoryComponent)!;

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
                    isSelected
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
            children: [
                gridView,
                uiOffset({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    layoutOffset: {
                        x: -60,
                        y: 0,
                    },
                    children: [
                        bookTabs((tab) => {
                            this.context.stateChanger.replace(
                                new BuildingState()
                            );
                        }),
                    ],
                }),
            ],
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
