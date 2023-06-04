import { sprites2 } from "../../../../asset/sprite";
import { allSides } from "../../../../common/sides";
import { UIThemeType } from "../../../../ui/color";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UIFlowGrid } from "../../../../ui/view/uiFlowGrid";
import { ChestComponent } from "../../../world/component/resource/chestComponent";
import { CollectChestJob } from "../../../world/job/jobs/chest/collectChestJob";
import { InteractionState } from "../../handler/interactionState";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";
import { UIBorderTitle } from "../../view/uiBorderTitle";
import { UIInventoryGridItem } from "../root/inventory/uiInventoryGridItem";

export class CollectChestState extends InteractionState {
    private _actionbar!: UIView;

    override get isModal(): boolean {
        return true;
    }

    constructor(private chest: ChestComponent) {
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
            { width: fillUiSize, height: fillUiSize }
        );
        this.view = scaffoldView;
    }

    private scheduleCollectJob() {
        const collectJob = new CollectChestJob(this.chest);
        this.context.world.jobQueue.schedule(collectJob);
        this.context.stateChanger.clear();
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
            const inventoryItem = this.chest.items[i];
            if (!!inventoryItem) {
                const isSelected = i == 0;
                const gridItem = new UIInventoryGridItem(
                    inventoryItem.asset,
                    isSelected,
                    UIThemeType.Stone
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
                    })
                );
            }
        }

        return gridView;
    }
}
