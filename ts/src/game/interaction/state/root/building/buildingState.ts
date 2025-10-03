import { Sprite2, sprites2 } from "../../../../../asset/sprite.js";
import { allSides } from "../../../../../common/sides.js";
import { bookInkColor } from "../../../../../ui/color.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { BuildConfirmState } from "../../building2/buildConfirmState.js";
import { Building } from "../../../../../data/building/building.js";
import { woodenBuildings } from "../../../../../data/building/wood/wood.js";
import { stoneBuildings } from "../../../../../data/building/stone/stone.js";
import { goldBuildings } from "../../../../../data/building/gold/gold.js";
import { foodBuildings } from "../../../../../data/building/food/food.js";
import { growBuildings } from "../../../../../data/building/grow/grow.js";
import { Point } from "../../../../../common/point.js";
import { createComponent } from "../../../../../ui/declarative/ui.js";
import { uiBookLayout } from "../../../../../ui/declarative/uiBookLayout.js";
import { uiScaffold } from "../../../view/uiScaffold.js";
import { uiBox } from "../../../../../ui/declarative/uiBox.js";
import { uiButton } from "../../../../../ui/declarative/uiButton.js";
import { uiRow, uiColumn } from "../../../../../ui/declarative/uiSequence.js";
import { uiImage } from "../../../../../ui/declarative/uiImage.js";
import { uiSpace } from "../../../../../ui/declarative/uiSpace.js";
import { uiText } from "../../../../../ui/declarative/uiText.js";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.js";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../../../ui/uiBackground.js";

// Declarative UI building components
const bookTextStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 16,
};

const bookTitleStyle = {
    color: bookInkColor,
    font: "Silkscreen",
    size: 20,
};

type BuildingListEntry = {
    sprite: Sprite2;
    name: string;
};

const buildingListItem = createComponent<{
    building: BuildingListEntry;
    onTap: () => void;
}>(({ props, withGesture }) => {
    withGesture("tap", () => {
        props.onTap();
        return true;
    });

    return uiButton({
        width: fillUiSize,
        height: wrapUiSize,
        padding: 12,
        background: ninePatchBackground({
            sprite: sprites2.book_grid_item,
            sides: allSides(8),
            scale: 1,
        }),
        pressedBackground: ninePatchBackground({
            sprite: sprites2.book_grid_item_focused,
            sides: allSides(8),
            scale: 1,
        }),
        child: uiRow({
            width: fillUiSize,
            height: wrapUiSize,
            children: [
                uiImage({
                    sprite: props.building.sprite,
                    width: 32,
                    height: 32,
                }),
                uiSpace({ width: 16, height: 8 }),
                uiText({
                    content: props.building.name,
                    textStyle: bookTextStyle,
                }),
            ],
        }),
    });
});

const buildingDetailsView = createComponent<{
    building: Building;
    onBuild: () => void;
}>(({ props }) => {
    const scale = props.building.scale * 2;

    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        child: uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            children: [
                uiBox({
                    width: fillUiSize,
                    height: 180,
                    background: ninePatchBackground({
                        sprite: sprites2.book_grid_item,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiImage({
                        sprite: props.building.icon,
                        width: props.building.icon.defintion.w * scale,
                        height: props.building.icon.defintion.h * scale,
                    }),
                }),
                uiSpace({ width: 1, height: 8 }),
                uiText({
                    content: props.building.name,
                    textStyle: bookTitleStyle,
                }),
                uiSpace({ width: 1, height: 8 }),
                uiText({
                    content: "Wood: 10",
                    textStyle: bookTextStyle,
                }),
                uiSpace({ width: 1, height: fillUiSize }),
                /*
                uiButton({
                    width: fillUiSize,
                    height: wrapUiSize,
                    padding: 8,
                    background: ninePatchBackground({
                        sprite: sprites2.book_grid_item,
                        sides: allSides(6),
                        scale: 1,
                    }),
                    onTap: () => props.onBuild(),
                    child: uiText({
                        content: "Build",
                        textStyle: bookTitleStyle,
                    }),
                }),*/
            ],
        }),
    });
});

const buildingMasterView = createComponent<{
    buildings: Building[];
    onBuildingSelect: (index: number) => void;
}>(({ props }) => {
    return uiBox({
        width: fillUiSize,
        height: fillUiSize,
        padding: 8,
        //background: colorBackground("red"),
        child: uiColumn({
            width: fillUiSize,
            height: fillUiSize,
            gap: 8,
            children: props.buildings.map((building, index) =>
                buildingListItem({
                    building: {
                        sprite: building.icon,
                        name: building.name,
                    },
                    onTap: () => props.onBuildingSelect(index),
                }),
            ),
        }),
    });
});

const buildingBookLayout = createComponent<{
    activeBuildings: Building[];
    selectedBuilding: Building;
    onBuildingSelect: (index: number) => void;
    onBuild: () => void;
    onTabSelect: (index: number) => void;
    selectedTab: number;
}>(({ props }) => {
    const masterView = buildingMasterView({
        buildings: props.activeBuildings,
        onBuildingSelect: props.onBuildingSelect,
    });

    const detailsView = buildingDetailsView({
        building: props.selectedBuilding,
        onBuild: props.onBuild,
    });

    return uiBookLayout({
        leftPage: masterView,
        rightPage: detailsView,
        tabs: [
            {
                icon: sprites2.wood_resource,
                isSelected: props.selectedTab === 0,
                onTap: () => props.onTabSelect(0),
            },
            {
                icon: sprites2.stone,
                isSelected: props.selectedTab === 1,
                onTap: () => props.onTabSelect(1),
            },
            {
                icon: sprites2.gold_coins,
                isSelected: props.selectedTab === 2,
                onTap: () => props.onTabSelect(2),
            },
            {
                icon: sprites2.resource_corn,
                isSelected: props.selectedTab === 3,
                onTap: () => props.onTabSelect(3),
            },
            {
                icon: sprites2.building_mill,
                isSelected: props.selectedTab === 4,
                onTap: () => props.onTabSelect(4),
            },
        ],
    });
});

export class BuildingState extends InteractionState {
    private _activeBuildings: Building[] = [];
    private _selectedBuilding: Building;
    private _selectedTab: number = 0;
    private _buildingPosition: Point;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Build";
    }

    override getView() {
        const scaffoldContent = buildingBookLayout({
            activeBuildings: this._activeBuildings,
            selectedBuilding: this._selectedBuilding,
            onBuildingSelect: (index: number) => this.setActiveBuilding(index),
            onBuild: () => this.buildSelected(),
            onTabSelect: (index: number) => this.tabSelected(index),
            selectedTab: this._selectedTab,
        });

        return uiScaffold({
            content: scaffoldContent,
            leftButtons: [
                {
                    text: "Build",
                    icon: sprites2.empty_sprite,
                    onClick: () => this.buildSelected(),
                },
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => this.context.stateChanger.pop(undefined),
                },
            ],
        });
    }

    constructor(buildingPosition: Point) {
        super();
        this._buildingPosition = buildingPosition;
        this._activeBuildings = woodenBuildings;
        this._selectedBuilding = woodenBuildings[0];
    }

    private buildSelected() {
        console.log("Build selected: ", this._selectedBuilding);
        this.context.stateChanger.replace(
            new BuildConfirmState(
                this._selectedBuilding,
                this._buildingPosition,
            ),
        );
    }

    private tabSelected(index: number) {
        this._selectedTab = index;
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
        this._selectedBuilding = this._activeBuildings[0];
    }

    private setActiveBuilding(index: number) {
        this._selectedBuilding = this._activeBuildings[index];
    }
}
