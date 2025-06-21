import { allSides, symmetricSides } from "../../../../common/sides.js";
import { Sprite2, sprites2 } from "../../../../module/asset/sprite.js";
import {
    bowItem,
    hammerItem,
    swordItem,
    wizardHat,
} from "../../../../data/inventory/items/equipment.js";
import { bookInkColor } from "../../../../module/ui/color.js";
import { ninePatchBackground } from "../../../../module/ui/dsl/uiBackgroundDsl.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { uiButton } from "../../../../module/ui/dsl/uiButtonDsl.js";
import { uiColumn } from "../../../../module/ui/dsl/uiColumnDsl.js";
import {
    spriteImageSource,
    uiImage,
} from "../../../../module/ui/dsl/uiImageDsl.js";
import { uiRow } from "../../../../module/ui/dsl/uiRowDsl.js";
import { uiSpace } from "../../../../module/ui/dsl/uiSpaceDsl.js";
import { uiText } from "../../../../module/ui/dsl/uiTextDsl.js";
import { uiAlignment } from "../../../../module/ui/uiAlignment.js";
import { fillUiSize, wrapUiSize } from "../../../../module/ui/uiSize.js";
import { UIView } from "../../../../module/ui/uiView.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIBookLayout } from "../../view/uiBookLayout.js";

export interface BookListAdapter {
    getTabs(): string[];
    getListItems(tab: string): BookListItem[];
    getDetails(selectedItem: number): BookListItem | null;
}

export interface BookListItem {
    image: Sprite2;
    name: string;
}

class BlacksmithAdapter implements BookListAdapter {
    constructor(private items: BookListItem[]) {}

    getTabs(): string[] {
        throw new Error("Method not implemented.");
    }
    getListItems(_tab: string): BookListItem[] {
        return this.items;
    }
    getDetails(selectedItem: number): BookListItem | null {
        return this.items[selectedItem];
    }
}

export class BookListState extends InteractionState {
    private _bookView: UIBookLayout;
    private _selectedItem: number = 0;

    public get selectedItem(): number {
        return this._selectedItem;
    }

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Craft";
    }

    constructor(protected adapter: BookListAdapter) {
        super();
        this._bookView = new UIBookLayout();
        this.setSelectedItem(0);
        /*
        this.view = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            alignment: uiAlignment.center,
            children: [this._bookView],
        });*/
    }

    protected onDetailsButton() {}

    private setSelectedItem(index: number) {
        this._selectedItem = index;
        const listItems = this.adapter.getListItems("");
        const detailItem = this.adapter.getDetails(index);
        const listView = this.getMasterView(listItems);
        const detailsView = this.getDetailsView(detailItem);

        this._bookView.leftPage = listView;
        this._bookView.rightPage = detailsView;
    }

    private getMasterView(items: BookListItem[]): UIView {
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
                    children: items.flatMap((item, index) => {
                        return [
                            {
                                child: this.getListItemView(item, index),
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

    private getDetailsView(item: BookListItem | null) {
        if (!!item) {
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
                                            scale: 2,
                                            image: spriteImageSource(
                                                item.image,
                                            ),
                                        }),
                                    ],
                                }),
                            },
                            {
                                child: uiText({
                                    padding: symmetricSides(0, 8),
                                    text: item.name,
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
                                    onTapCallback: () => {
                                        this.onDetailsButton();
                                        this.context.stateChanger.pop();
                                    },
                                    padding: allSides(16),
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
                                                top: 6,
                                                bottom: 8,
                                            },
                                            text: "Craft",
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
        } else {
            return uiBox({
                width: 300,
                height: fillUiSize,
            });
        }
    }

    private getListItemView(item: BookListItem, index: number): UIView {
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
                                image: spriteImageSource(item.image),
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
                                text: item.name,
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
                this.setSelectedItem(index);
            },
        });
    }
}

const items = [swordItem, bowItem, wizardHat, hammerItem];
const bookItems = items.map((item) => {
    return {
        image: item.asset,
        name: item.name,
    };
});

/*
export class CraftWithBuildingState extends BookListState {
    constructor(private building: BuildingComponent) {
        super(new BlacksmithAdapter(bookItems));
    }

    protected override onDetailsButton(): void {
        const selected = items[this.selectedItem];
        const craftingComponent =
            this.building.entity.requireComponent(CraftingComponent);

        craftingComponent.queueCrafting(selected.id);
    }
}*/
