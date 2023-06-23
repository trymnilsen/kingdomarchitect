function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { UIThemeType } from "../../../../ui/color.js";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { UIFlowGrid } from "../../../../ui/view/uiFlowGrid.js";
import { CollectChestJob } from "../../../world/job/jobs/chest/collectChestJob.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { UIBorderTitle } from "../../view/uiBorderTitle.js";
import { UIInventoryGridItem } from "../root/inventory/uiInventoryGridItem.js";
export class CollectChestState extends InteractionState {
    get isModal() {
        return true;
    }
    onActive() {
        const borderWrapper = new UIBorderTitle({
            height: wrapUiSize,
            width: 300
        });
        borderWrapper.title = "Chest";
        borderWrapper.background = ninePatchBackground({
            sprite: sprites2.stone_slate_background_2x,
            sides: allSides(32),
            scale: 2
        });
        const chestUI = uiBox({
            width: fillUiSize,
            height: wrapUiSize,
            padding: {
                top: 0,
                left: 16,
                right: 16,
                bottom: 16
            },
            children: [
                this.getGridView()
            ]
        });
        borderWrapper.addView(chestUI);
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            children: [
                borderWrapper
            ]
        });
        const scaffoldView = new UIActionbarScaffold(contentView, [
            {
                text: "Collect",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.scheduleCollectJob();
                }
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: ()=>{
                    this.context.stateChanger.pop(null);
                }
            }
        ], [], {
            width: fillUiSize,
            height: fillUiSize
        });
        this.view = scaffoldView;
    }
    scheduleCollectJob() {
        const collectJob = new CollectChestJob(this.chest);
        this.context.world.jobQueue.schedule(collectJob);
        this.context.stateChanger.clear();
    }
    itemSelected(index, gridItem) {}
    getGridView() {
        const gridView = new UIFlowGrid({
            width: fillUiSize,
            height: wrapUiSize
        });
        gridView.id = "chestGrid";
        gridView.gridItemSize = 50;
        for(let i = 0; i < 8; i++){
            const inventoryItem = this.chest.items[i];
            if (!!inventoryItem) {
                const isSelected = i == 0;
                const gridItem = new UIInventoryGridItem(inventoryItem.asset, isSelected, UIThemeType.Stone);
                gridItem.id = inventoryItem.name;
                gridItem.onTapCallback = ()=>{
                    this.itemSelected(i, gridItem);
                };
                gridView.addView(gridItem);
            } else {
                gridView.addView(uiBox({
                    width: fillUiSize,
                    height: fillUiSize,
                    background: ninePatchBackground({
                        sprite: sprites2.book_grid_item_gray,
                        sides: allSides(8),
                        scale: 1
                    })
                }));
            }
        }
        return gridView;
    }
    constructor(chest){
        super();
        _define_property(this, "chest", void 0);
        _define_property(this, "_actionbar", void 0);
        this.chest = chest;
    }
}
