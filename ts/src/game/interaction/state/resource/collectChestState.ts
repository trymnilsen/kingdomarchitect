import { sprites2 } from "../../../../asset/sprite";
import { allSides, symmetricSides } from "../../../../common/sides";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { HorizontalAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UIBorderTitle } from "../../../../ui/view/uiBorderTitle";
import { UIFlowGrid } from "../../../../ui/view/uiFlowGrid";
import { ChestComponent } from "../../../world/component/resource/chestComponent";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { UIInventoryGridItem } from "../root/inventory/uiInventoryGridItem";

const actions: ActionButton[] = [
    {
        id: "collect",
        name: "Collect",
    },
    {
        id: "cancel",
        name: "Close",
    },
];

export class CollectChestState extends InteractionState {
    private _actionbar!: UIView;

    override get isModal(): boolean {
        return true;
    }

    constructor(private chest: ChestComponent) {
        super();
    }

    override onActive(): void {
        this._actionbar = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });
        this._actionbar.size = {
            width: fillUiSize,
            height: wrapUiSize,
        };

        const borderWrapper = new UIBorderTitle({
            height: wrapUiSize,
            width: 300,
        });

        borderWrapper.title = "Chest";

        const chestUI = uiBox({
            width: fillUiSize,
            height: wrapUiSize,
            padding: symmetricSides(16, 32),
            background: ninePatchBackground({
                sprite: sprites2.stone_slate_background_2x,
                sides: allSides(32),
                scale: 2,
            }),
            children: [
                uiBox({
                    id: "chestGridBox",
                    width: fillUiSize,
                    height: wrapUiSize,
                    children: [this.getGridView()],
                }),
            ],
        });

        borderWrapper.addView(chestUI);

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
                                id: "chestState",
                                width: fillUiSize,
                                height: fillUiSize,
                                padding: allSides(64),
                                children: [borderWrapper],
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

    private actionSelected(action: ActionButton) {
        console.log("Action pressed: ", action);
        if (action.id == "cancel") {
            this.context.stateChanger.pop(undefined);
        }
    }

    private itemSelected(index: number, gridItem: UIInventoryGridItem) {}

    private getGridView(): UIView {
        const gridView = new UIFlowGrid({
            width: fillUiSize,
            height: wrapUiSize,
        });
        gridView.id = "chestGrid";
        gridView.gridItemSize = 50;

        for (let i = 0; i < 8; i++) {
            const inventoryItem = null;
            if (!!inventoryItem) {
                /* const isSelected = i == 0;
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
                gridView.addView(gridItem); */
            } else {
                gridView.addView(
                    uiBox({
                        width: fillUiSize,
                        height: fillUiSize,
                        background: ninePatchBackground({
                            sprite: sprites2.book_grid_item_gray,
                            sides: allSides(8),
                            scale: 1,
                        }),
                    })
                );
            }
        }

        return gridView;
    }
}
