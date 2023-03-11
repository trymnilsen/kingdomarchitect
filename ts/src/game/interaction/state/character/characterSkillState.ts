import { withinRectangle } from "../../../../common/bounds";
import { Point } from "../../../../common/point";
import { allSides, symmetricSides } from "../../../../common/sides";
import {
    bookFill,
    bookInkColor,
    hiddenBookInkColor,
} from "../../../../ui/color";
import { boxBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize";
import { UIView } from "../../../../ui/uiView";
import { UIMasterDetails } from "../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../ui/visual/bookBackground";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { UISkillTree } from "./uiSkillTree";

const actions: ActionButton[] = [
    {
        id: "unlock",
        name: "Unlock",
    },
    {
        id: "cancel",
        name: "cancel",
    },
];

export class CharacterSkillState extends InteractionState {
    private _masterDetailsView: UIMasterDetails;
    private _actionbar: UIView;
    private _skillTree: UISkillTree;
    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        this._skillTree = new UISkillTree({
            width: fillUiSize,
            height: fillUiSize,
        });

        const masterView = this.getMasterView();
        const detailsView = this.getDetailsView(0);

        this._actionbar = getActionbarView(actions, (action) => {
            this.actionSelected(action);
        });

        this._actionbar.size = {
            width: fillUiSize,
            height: wrapUiSize,
        };

        this._masterDetailsView = new UIMasterDetails(masterView, detailsView, {
            width: fillUiSize,
            height: fillUiSize,
        });

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
                                id: "characterSkillsLayout",
                                width: fillUiSize,
                                height: fillUiSize,
                                padding: allSides(64),
                                alignment: uiAlignment.center,
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

    override onTapPan(
        movement: Point,
        position: Point,
        startPosition: Point
    ): void {
        const panViewBounds = this._skillTree.bounds;
        if (
            withinRectangle(
                startPosition,
                panViewBounds.x1,
                panViewBounds.y1,
                panViewBounds.x2,
                panViewBounds.y2
            )
        ) {
            this._skillTree.panView(movement);
        }
    }

    private actionSelected(action: ActionButton) {}

    private getMasterView(): UIView {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.topLeft,
            padding: {
                left: 40,
                right: 32,
                top: 32,
                bottom: 48,
            },
            children: [
                /*
                uiOffset({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    layoutOffset: {
                        x: -68,
                        y: 0,
                    },
                    children: [
                        bookTabs((tab) => {
                            this.context.stateChanger.replace(
                                new InventoryState()
                            );
                        }),
                    ],
                }),*/
                uiBox({
                    width: fillUiSize,
                    height: fillUiSize,
                    background: boxBackground({
                        fill: bookFill,
                        stroke: hiddenBookInkColor,
                        strokeWidth: 2,
                    }),
                    children: [this._skillTree],
                }),
            ],
        });
    }

    private getDetailsView(index: number): UIView {
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
                    text: "Skill details",
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
