import { Sprite2, sprites2 } from "../../../../../asset/sprite";
import { allSides, symmetricSides } from "../../../../../common/sides";
import { bookInkColor } from "../../../../../ui/color";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../../ui/dsl/uiImageDsl";
import { uiRow } from "../../../../../ui/dsl/uiRowDsl";
import { uiSpace } from "../../../../../ui/dsl/uiSpaceDsl";
import { uiText } from "../../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../../ui/uiAlignment";
import { UIView } from "../../../../../ui/uiView";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize";
import { InteractionState } from "../../../handler/interactionState";
import { BuildConfirmState } from "../../building2/buildConfirmState";
import { UIBookLayout, UIBookLayoutTab } from "../../../view/uiBookLayout";
import { Building } from "../../../../../data/building/building";
import { woodenBuildings } from "../../../../../data/building/wood";
import { stoneBuildings } from "../../../../../data/building/stone";
import { goldBuildings } from "../../../../../data/building/gold";
import { foodBuildings } from "../../../../../data/building/food";
import { SpriteBackground } from "../../../../../ui/uiBackground";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold";

export class BuildingState extends InteractionState {
    private _masterDetailsView: UIBookLayout;

    private _activeBuildings: Building[] = [];
    private _selectedBuilding: Building;

    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();

        const rightItems: UIActionbarItem[] = [
            {
                text: "Build",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    console.log("Build selected: ", this._selectedBuilding);
                    this.context.stateChanger.replace(
                        new BuildConfirmState(this._selectedBuilding)
                    );
                },
            },
            {
                text: "Cancel",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.pop(undefined);
                },
            },
        ];

        this._activeBuildings = woodenBuildings;
        this._selectedBuilding = woodenBuildings[0];
        const masterView = this.getMasterView();
        const detailsView = this.getDetailsView(this._selectedBuilding);

        this._masterDetailsView = new UIBookLayout();
        this._masterDetailsView.leftPage = masterView;
        this._masterDetailsView.rightPage = detailsView;
        this._masterDetailsView.setTabs(this.getTabs(0));

        const contentView = uiBox({
            id: "buildStateLayout",
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.center,
            children: [this._masterDetailsView],
        });

        const scaffoldState = new UIActionbarScaffold(
            contentView,
            rightItems,
            [],
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldState;
    }

    private tabSelected(index: number) {
        this._masterDetailsView.setTabs(this.getTabs(index));
        switch (index) {
            case 1:
                this._activeBuildings = stoneBuildings;
                break;
            case 2:
                this._activeBuildings = goldBuildings;
                break;
            case 3:
                this._activeBuildings = foodBuildings;
                break;
            default:
                this._activeBuildings = woodenBuildings;
                break;
        }
        const masterView = this.getMasterView();
        this._masterDetailsView.leftPage = masterView;
    }

    private setActiveBuilding(index: number) {
        const activeBuilding = this._activeBuildings[index];
        const detailsView = this.getDetailsView(activeBuilding);
        this._masterDetailsView.rightPage = detailsView;
        this._selectedBuilding = activeBuilding;
    }

    private getMasterView(): UIView {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.topLeft,
            padding: {
                left: 40,
                right: 32,
                top: 32,
                bottom: 32,
            },
            children: [
                uiColumn({
                    children: this._activeBuildings.flatMap(
                        (building, index) => {
                            return [
                                {
                                    child: this.getBuildingListItem(
                                        {
                                            sprite: building.icon,
                                            name: building.name,
                                        },
                                        index
                                    ),
                                },
                                {
                                    child: uiSpace({ width: 1, height: 8 }),
                                },
                            ];
                        }
                    ),
                    width: fillUiSize,
                    height: fillUiSize,
                }),
            ],
        });
    }

    private getBuildingListItem(
        building: BuildingListEntry,
        index: number
    ): UIView {
        return uiButton({
            padding: allSides(16),
            width: fillUiSize,
            height: wrapUiSize,
            defaultBackground: ninePatchBackground({
                sprite: sprites2.book_grid_item,
                sides: allSides(8),
                scale: 1,
            }),
            onTappedBackground: ninePatchBackground({
                sprite: sprites2.book_grid_item_focused,
                sides: allSides(8),
                scale: 1,
            }),
            children: [
                uiRow({
                    width: fillUiSize,
                    height: wrapUiSize,
                    children: [
                        {
                            child: uiImage({
                                width: 32,
                                height: 32,
                                image: spriteImageSource(building.sprite),
                            }),
                        },
                        {
                            child: uiSpace({
                                width: 16,
                                height: 8,
                            }),
                        },
                        {
                            child: uiText({
                                id: "buildingName",
                                alignment: uiAlignment.centerLeft,
                                text: building.name,
                                style: {
                                    color: bookInkColor,
                                    font: "Silkscreen",
                                    size: 16,
                                },
                                width: fillUiSize,
                                height: wrapUiSize,
                            }),
                            weight: 1,
                        },
                    ],
                }),
            ],
            onTapCallback: () => {
                this.setActiveBuilding(index);
            },
        });
    }

    private getDetailsView(building: Building): UIView {
        const scale = building.scale * 2;
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
                                        height: wrapUiSize,
                                        width: wrapUiSize,
                                        scale: scale,
                                        image: spriteImageSource(building.icon),
                                    }),
                                ],
                            }),
                        },
                        {
                            child: uiText({
                                padding: symmetricSides(0, 8),
                                text: building.name,
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
                                text: `Wood: 10`,
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
                            child: uiSpace({
                                id: "middlespace",
                                height: fillUiSize,
                                width: fillUiSize,
                            }),
                            weight: 1,
                        },
                    ],
                }),
            ],
        });
    }

    private getTabs(selectedTab: number): UIBookLayoutTab[] {
        return [
            {
                icon: sprites2.wood_resource,
                isSelected: selectedTab == 0,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
            {
                icon: sprites2.stone,
                isSelected: selectedTab == 1,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
            {
                icon: sprites2.gold_coins,
                isSelected: selectedTab == 2,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
            {
                icon: sprites2.resource_corn,
                isSelected: selectedTab == 3,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
        ];
    }
}

interface BuildingListEntry {
    sprite: Sprite2;
    name: string;
}
