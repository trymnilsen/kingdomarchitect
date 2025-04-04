import { Sprite2, sprites2 } from "../../../../../module/asset/sprite.js";
import { allSides, symmetricSides } from "../../../../../common/sides.js";
import { bookInkColor } from "../../../../../module/ui/color.js";
import { ninePatchBackground } from "../../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../../module/ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../../../module/ui/dsl/uiImageDsl.js";
import { uiRow } from "../../../../../module/ui/dsl/uiRowDsl.js";
import { uiSpace } from "../../../../../module/ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../../../module/ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../../module/ui/uiAlignment.js";
import { UIView } from "../../../../../module/ui/uiView.js";
import { fillUiSize, wrapUiSize } from "../../../../../module/ui/uiSize.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { BuildConfirmState } from "../../building2/buildConfirmState.js";
import { UIBookLayout, UIBookLayoutTab } from "../../../view/uiBookLayout.js";
import { Building } from "../../../../../data/building/building.js";
import { woodenBuildings } from "../../../../../data/building/wood/wood.js";
import { stoneBuildings } from "../../../../../data/building/stone/stone.js";
import { goldBuildings } from "../../../../../data/building/gold/gold.js";
import { foodBuildings } from "../../../../../data/building/food/food.js";
import { SpriteBackground } from "../../../../../module/ui/uiBackground.js";
import {
    UIActionbar,
    UIActionbarAlignment,
    UIActionbarItem,
} from "../../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
import { growBuildings } from "../../../../../data/building/grow/grow.js";
import { Point } from "../../../../../common/point.js";

export class BuildingState extends InteractionState {
    private _masterDetailsView: UIBookLayout;

    private _activeBuildings: Building[] = [];
    private _selectedBuilding: Building;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Build";
    }

    constructor(buildingPosition: Point) {
        super();

        const rightItems: UIActionbarItem[] = [
            {
                text: "Build",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    console.log("Build selected: ", this._selectedBuilding);
                    this.context.stateChanger.replace(
                        new BuildConfirmState(
                            this._selectedBuilding,
                            buildingPosition,
                        ),
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
            { width: fillUiSize, height: fillUiSize },
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
                this._activeBuildings = growBuildings;
                break;
            case 4:
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
                                        index,
                                    ),
                                },
                                {
                                    child: uiSpace({ width: 1, height: 8 }),
                                },
                            ];
                        },
                    ),
                    width: fillUiSize,
                    height: fillUiSize,
                }),
            ],
        });
    }

    private getBuildingListItem(
        building: BuildingListEntry,
        index: number,
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
            height: fillUiSize,
            padding: {
                bottom: 40,
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
                        {
                            child: uiButton({
                                onTapCallback: () => {},
                                padding: allSides(8),
                                defaultBackground: ninePatchBackground({
                                    sprite: sprites2.book_grid_item,
                                    sides: allSides(6),
                                    scale: 1,
                                }),
                                onTappedBackground: ninePatchBackground({
                                    sprite: sprites2.book_grid_item_focused,
                                    sides: allSides(6),
                                    scale: 1,
                                }),
                                children: [
                                    uiText({
                                        padding: {
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            bottom: 8,
                                        },
                                        text: "Build",
                                        style: {
                                            color: bookInkColor,
                                            font: "Silkscreen",
                                            size: 20,
                                        },
                                        width: fillUiSize,
                                        height: wrapUiSize,
                                    }),
                                ],
                                width: fillUiSize,
                                height: wrapUiSize,
                            }),
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
            {
                icon: sprites2.building_mill,
                isSelected: selectedTab == 4,
                onTap: (index) => {
                    this.tabSelected(index);
                },
            },
        ];
    }
}

type BuildingListEntry = {
    sprite: Sprite2;
    name: string;
};
