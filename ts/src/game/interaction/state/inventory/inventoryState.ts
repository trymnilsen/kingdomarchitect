import { allSides } from "../../../../common/sides";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize } from "../../../../ui/uiView";
import { UIMasterDetails } from "../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../ui/visual/bookBackground";
import { InteractionState } from "../../handler/interactionState";

export class InventoryState extends InteractionState {
    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        const detailsView = uiBox({
            width: 300,
            height: 400,
        });

        const masterView = uiBox({
            width: 300,
            height: 400,
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
