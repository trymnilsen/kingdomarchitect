import { allSides } from "../../../../common/sides";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize } from "../../../../ui/uiView";
import { UIFlowGrid } from "../../../../ui/view/uiFlowGrid";
import { UIMasterDetails } from "../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../ui/visual/bookBackground";
import { InteractionState } from "../../handler/interactionState";

export class InventoryState extends InteractionState {
    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        const gridView = new UIFlowGrid({
            width: fillUiSize,
            height: fillUiSize,
        });
        gridView.gridItemSize = 50;

        for (let i = 0; i < 8; i++) {
            const gridItem = uiBox({
                width: fillUiSize,
                height: fillUiSize,
                background: ninePatchBackground({
                    asset: "book_grid_item",
                    sides: allSides(8),
                    scale: 1,
                }),
            });
            gridView.addView(gridItem);
        }

        const detailsView = uiBox({
            width: 300,
            height: 400,
        });

        const masterView = uiBox({
            width: 300,
            height: 400,
            padding: allSides(32),
            children: [gridView],
        });

        const masterDetailsView = new UIMasterDetails(masterView, detailsView, {
            width: fillUiSize,
            height: fillUiSize,
        });

        masterDetailsView.dualBackground = new OpenBookUIBackground();

        this.view = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(64),
            alignment: uiAlignment.center,
            children: [masterDetailsView],
        });
    }
}
