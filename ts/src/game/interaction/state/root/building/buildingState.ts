import { Sprite2, sprites2 } from "../../../../../asset/sprite";
import { allSides, symmetricSides } from "../../../../../common/sides";
import { bookInkColor } from "../../../../../ui/color";
import { ninePatchBackground } from "../../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../../ui/dsl/uiColumnDsl";
import { spriteImageSource, uiImage } from "../../../../../ui/dsl/uiImageDsl";
import { uiOffset } from "../../../../../ui/dsl/uiOffsetDsl";
import { uiRow } from "../../../../../ui/dsl/uiRowDsl";
import { uiSpace } from "../../../../../ui/dsl/uiSpaceDsl";
import { uiText } from "../../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../../ui/uiAlignment";
import { fillUiSize, UIView, wrapUiSize } from "../../../../../ui/uiView";
import { UIMasterDetails } from "../../../../../ui/view/uiMasterDetail";
import { OpenBookUIBackground } from "../../../../../ui/visual/bookBackground";
import { InteractionState } from "../../../handler/interactionState";
import { BuildConfirmState } from "../../building2/buildConfirmState";
import { InventoryState } from "../inventory/inventoryState";
import { bookTabs } from "../ui/bookTabs";

const buildings: BuildingListEntry[] = [
    {
        name: "Wooden House",
        sprite: sprites2.wooden_house,
    },
    {
        name: "Wall",
        sprite: sprites2.stone_wood_walls,
    },
];

export class BuildingState extends InteractionState {
    private _masterDetailsView: UIMasterDetails;

    override get isModal(): boolean {
        return true;
    }

    constructor() {
        super();

        const masterView = this.getMasterView();
        const detailsView = this.getDetailsView(0);

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

    private setActiveBuilding(index: number) {}

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
                }),
                uiColumn({
                    children: buildings.flatMap((building, index) => {
                        return [
                            {
                                child: this.getBuildingListItem(
                                    building,
                                    index
                                ),
                            },
                            {
                                child: uiSpace({ width: 1, height: 8 }),
                            },
                        ];
                    }),
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
                                width: 20,
                                height: 20,
                                image: spriteImageSource(building.sprite),
                            }),
                        },
                        {
                            child: uiSpace({
                                width: 8,
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
                                        scale: 2,
                                        image: spriteImageSource(
                                            sprites2.wooden_house
                                        ),
                                    }),
                                ],
                            }),
                        },
                        {
                            child: uiText({
                                padding: symmetricSides(0, 8),
                                text: "Wood House",
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
                                width: fillUiSize,
                                height: wrapUiSize,
                                children: [
                                    uiBox({
                                        height: 40,
                                        width: fillUiSize,
                                        children: [
                                            uiText({
                                                text: "Build",
                                                style: {
                                                    color: bookInkColor,
                                                    font: "Silkscreen",
                                                    size: 16,
                                                },
                                                width: fillUiSize,
                                                height: wrapUiSize,
                                            }),
                                        ],
                                    }),
                                ],
                                onTapCallback: () => {
                                    this.context.stateChanger.replace(
                                        new BuildConfirmState()
                                    );
                                },
                                defaultBackground: ninePatchBackground({
                                    sprite: sprites2.stone_slate_background,
                                    scale: 2,
                                }),
                            }),
                        },
                        {
                            child: uiSpace({
                                height: 16,
                                width: 16,
                            }),
                        },
                    ],
                }),
            ],
        });
    }
}

interface BuildingListEntry {
    sprite: Sprite2;
    name: string;
}
