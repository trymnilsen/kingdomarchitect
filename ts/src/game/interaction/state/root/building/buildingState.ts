import { allSides } from "../../../../../common/sides";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { uiOffset } from "../../../../../ui/dsl/uiOffsetDsl";
import { uiAlignment } from "../../../../../ui/uiAlignment";
import { fillUiSize, UIView, wrapUiSize } from "../../../../../ui/uiView";
import { UIMasterDetails } from "../../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../../ui/visual/bookBackground";
import { InteractionState } from "../../../handler/interactionState";
import { InventoryState } from "../inventory/inventoryState";
import { bookTabs } from "../ui/bookTabs";

export class BuildingState extends InteractionState {
    private _masterDetailsView: UIMasterDetails;

    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();

        const masterView = this.getMasterView();
        const detailsView = this.getDetailsView();

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

    private getMasterView(): UIView {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.topLeft,
            padding: allSides(32),
            children: [
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
                                new InventoryState()
                            );
                        }),
                    ],
                }),
            ],
        });
    }

    private getDetailsView(): UIView {
        return uiBox({
            width: 300,
            height: 400,
            padding: allSides(32),
            children: [],
        });
    }
}
