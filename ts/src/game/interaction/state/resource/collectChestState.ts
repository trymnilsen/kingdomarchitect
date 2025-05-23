import { allSides } from "../../../../common/sides.js";
import { sprites2 } from "../../../../module/asset/sprite.js";
import { UIThemeType } from "../../../../module/ui/color.js";
import { ninePatchBackground } from "../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { fillUiSize, wrapUiSize } from "../../../../module/ui/uiSize.js";
import { UIView } from "../../../../module/ui/uiView.js";
import { UIFlowGrid } from "../../../../module/ui/view/uiFlowGrid.js";
import type { Entity } from "../../../entity/entity.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { UIBorderTitle } from "../../view/uiBorderTitle.js";
import { UIInventoryGridItem } from "../root/inventory/uiInventoryGridItem.js";

export class CollectChestState extends InteractionState {
    private _actionbar!: UIView;

    override get stateName(): string {
        return "Collect chest";
    }

    override get isModal(): boolean {
        return true;
    }

    constructor(private chestEntity: Entity) {
        super();
    }

    override onActive(): void {
        const borderWrapper = new UIBorderTitle({
            height: wrapUiSize,
            width: 300,
        });

        borderWrapper.title = "Chest";
        borderWrapper.background = ninePatchBackground({
            sprite: sprites2.stone_slate_background_2x,
            sides: allSides(32),
            scale: 2,
        });

        const chestUI = uiBox({
            width: fillUiSize,
            height: wrapUiSize,
            padding: {
                top: 0,
                left: 16,
                right: 16,
                bottom: 16,
            },
            children: [this.getGridView()],
        });

        borderWrapper.addView(chestUI);
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            children: [borderWrapper],
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            [
                {
                    text: "Collect",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.scheduleCollectJob();
                    },
                },
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
            [],
            { width: fillUiSize, height: fillUiSize },
        );
        this.view = scaffoldView;
    }

    private scheduleCollectJob() {
        //TODO: Reimplement collecting a chest
        /*
        const collectJob = new CollectChestJob(this.chest);

        this.context.root
            .requireComponent(JobQueueComponent)
            .addJob(collectJob);

        this.context.stateChanger.clear();
        */
    }

    private itemSelected(_index: number, _gridItem: UIInventoryGridItem) {}

    private getGridView(): UIView {
        const gridView = new UIFlowGrid({
            width: fillUiSize,
            height: wrapUiSize,
        });
        gridView.id = "chestGrid";
        gridView.gridItemSize = 50;

        /*
        TODO: Reimplement showing the chest content
        for (let i = 0; i < 8; i++) {
            const inventoryItem = this.chest.items[i];
            if (inventoryItem) {
                const isSelected = i == 0;
                const gridItem = new UIInventoryGridItem(
                    inventoryItem.asset,
                    isSelected,
                    UIThemeType.Stone,
                );
                gridItem.id = inventoryItem.name;

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
                            sprite: sprites2.book_grid_item_gray,
                            sides: allSides(8),
                            scale: 1,
                        }),
                    }),
                );
            }
        }
            */

        return gridView;
    }
}
