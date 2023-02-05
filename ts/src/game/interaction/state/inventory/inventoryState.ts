import { ImageAsset } from "../../../../asset/assets";
import { allSides, symmetricSides } from "../../../../common/sides";
import { bookInkColor } from "../../../../ui/color";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { assetImageSource, uiImage } from "../../../../ui/dsl/uiImageDsl";
import { uiOffset } from "../../../../ui/dsl/uiOffsetDsl";
import { uiSpace } from "../../../../ui/dsl/uiSpaceDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { HorizontalAlignment, uiAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize, UIView, wrapUiSize } from "../../../../ui/uiView";
import { UIFlowGrid } from "../../../../ui/view/uiFlowGrid";
import { UIMasterDetails } from "../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../ui/visual/bookBackground";
import { InteractionState } from "../../handler/interactionState";
import { UIInventoryGridItem } from "./uiInventoryGridItem";

export interface InventoryItems {
    name: string;
    asset: ImageAsset;
    amount: number;
    value: number;
}

export class InventoryState extends InteractionState {
    private _masterDetailsView: UIMasterDetails;
    private _selectedGridItemView: UIInventoryGridItem | undefined;
    private items: InventoryItems[] = [
        {
            name: "Block of wood",
            asset: "woodResource",
            amount: 7,
            value: 27,
        },
        {
            name: "Bag o' glitter",
            asset: "bagOfGlitter",
            amount: 1,
            value: 300,
        },
        {
            name: "Ruby Gem",
            asset: "gemResource",
            amount: 1,
            value: 500,
        },
        {
            name: "Stone",
            asset: "stoneResource",
            amount: 53,
            value: 154,
        },
    ];
    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();

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

        this.view = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            alignment: uiAlignment.center,
            children: [this._masterDetailsView],
        });
    }

    private itemSelected(index: number, view: UIInventoryGridItem) {
        this._masterDetailsView.showDetails(this.getDetailsView(index));
        if (this._selectedGridItemView) {
            this._selectedGridItemView.isSelected = false;
        }

        this._selectedGridItemView = view;
        view.isSelected = true;
    }

    private getMasterGridView(): UIView {
        const gridView = new UIFlowGrid({
            width: fillUiSize,
            height: fillUiSize,
        });
        gridView.gridItemSize = 50;

        for (let i = 0; i < 8; i++) {
            const inventoryItem = this.items[i];
            if (!!inventoryItem) {
                const isSelected = i == 0;
                const gridItem = new UIInventoryGridItem(
                    inventoryItem.asset,
                    isSelected
                );

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
                            asset: "book_grid_item",
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
                        uiColumn({
                            horizontalAlignment: HorizontalAlignment.Right,
                            width: 100,
                            height: wrapUiSize,
                            children: [
                                {
                                    child: uiBox({
                                        width: 38,
                                        height: 48,
                                        background: ninePatchBackground({
                                            asset: "book_tab",
                                            scale: 1,
                                            sides: allSides(8),
                                        }),
                                    }),
                                },
                                {
                                    child: uiSpace({
                                        width: 1,
                                        height: 8,
                                    }),
                                },
                                {
                                    child: uiBox({
                                        width: 38,
                                        height: 48,
                                        background: ninePatchBackground({
                                            asset: "book_tab",
                                            scale: 1,
                                            sides: allSides(8),
                                        }),
                                    }),
                                },
                                {
                                    child: uiSpace({
                                        width: 1,
                                        height: 8,
                                    }),
                                },
                                {
                                    child: uiBox({
                                        width: 48,
                                        height: 48,
                                        background: ninePatchBackground({
                                            asset: "book_tab",
                                            scale: 1,
                                            sides: allSides(8),
                                        }),
                                    }),
                                },
                            ],
                        }),
                    ],
                }),
            ],
        });
    }

    private getDetailsView(index: number): UIView {
        const inventoryItem = this.items[index];

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
                                    asset: "book_grid_item",
                                    sides: allSides(8),
                                    scale: 1,
                                }),
                                children: [
                                    uiImage({
                                        height: 64,
                                        width: 64,
                                        image: assetImageSource(
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
                    ],
                }),
            ],
        });
    }
}

export function getAssetImage(index: number): ImageAsset | null {
    switch (index) {
        case 0:
            return "woodResource";
        case 1:
            return "bagOfGlitter";
        case 2:
            return "gemResource";
        case 3:
            return "stoneResource";
        default:
            return null;
    }
}
