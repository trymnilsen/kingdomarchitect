import {
    spriteRefs,
    type SpriteRef,
    SPRITE_W,
    SPRITE_H,
} from "../../../../../asset/sprite.ts";
import { spriteRegistry } from "../../../../../asset/spriteRegistry.ts";
import { allSides } from "../../../../../common/sides.ts";
import { bookInkColor } from "../../../../../ui/color.ts";
import { InteractionState } from "../../../handler/interactionState.ts";
import { BuildConfirmState } from "../../building2/buildConfirmState.ts";
import {
    Building,
    specialRequirementNames,
    type SpecialRequirement,
} from "../../../../../data/building/building.ts";
import { woodenBuildings } from "../../../../../data/building/wood/wood.ts";
import { stoneBuildings } from "../../../../../data/building/stone/stone.ts";
import { goldBuildings } from "../../../../../data/building/gold/gold.ts";
import { foodBuildings } from "../../../../../data/building/food/food.ts";
import { growBuildings } from "../../../../../data/building/grow/grow.ts";
import { Point } from "../../../../../common/point.ts";
import {
    createComponent,
    type ComponentDescriptor,
} from "../../../../../ui/declarative/ui.ts";
import { uiBookLayout } from "../../../../../ui/declarative/uiBookLayout.ts";
import { uiScaffold } from "../../../view/uiScaffold.ts";
import { uiBox } from "../../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../../ui/declarative/uiButton.ts";
import { uiRow, uiColumn } from "../../../../../ui/declarative/uiSequence.ts";
import { uiImage } from "../../../../../ui/declarative/uiImage.ts";
import { uiSpace } from "../../../../../ui/declarative/uiSpace.ts";
import { uiText } from "../../../../../ui/declarative/uiText.ts";
import { fillUiSize, wrapUiSize } from "../../../../../ui/uiSize.ts";
import {
    colorBackground,
    ninePatchBackground,
} from "../../../../../ui/uiBackground.ts";
import {
    inventoryItemsMap,
    type InventoryItemIds,
} from "../../../../../data/inventory/inventoryItems.ts";
import type { InventoryItem } from "../../../../../data/inventory/inventoryItem.ts";
import { createLogger } from "../../../../../common/logging/logger.ts";
import { ItemSourceState } from "../../itemsource/itemSourceState.ts";

const log = createLogger("interaction");

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
    sprite: SpriteRef;
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
            sprite: spriteRefs.book_grid_item,
            sides: allSides(8),
            scale: 1,
        }),
        pressedBackground: ninePatchBackground({
            sprite: spriteRefs.book_grid_item_focused,
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

const requirementMaterialRow = createComponent<{
    item: InventoryItem;
    amount: number;
    onItemTap?: (item: InventoryItem) => void;
}>(({ props }) => {
    const row = uiRow({
        width: fillUiSize,
        height: wrapUiSize,
        children: [
            uiImage({ sprite: props.item.asset, width: 16, height: 16 }),
            uiSpace({ width: 4, height: 1 }),
            uiText({
                content: `${props.amount}x ${props.item.name}`,
                textStyle: bookTextStyle,
            }),
        ],
    });

    if (props.onItemTap) {
        const onTap = props.onItemTap;
        const item = props.item;
        return uiButton({
            width: fillUiSize,
            height: wrapUiSize,
            onTap: () => onTap(item),
            child: row,
        });
    }

    return row;
});

const buildingRequirementsView = createComponent<{
    building: Building;
    onItemTap?: (item: InventoryItem) => void;
}>(({ props }) => {
        const requirements = props.building.requirements;

        if (!requirements) {
            return uiText({
                content: "No requirements",
                textStyle: bookTextStyle,
            });
        }

        const children: ComponentDescriptor[] = [];

        if (requirements.materials) {
            children.push(
                uiText({
                    content: "Materials:",
                    textStyle: bookTextStyle,
                }),
            );

            for (const [itemId, amount] of Object.entries(
                requirements.materials,
            )) {
                if (amount === undefined || amount <= 0) continue;
                const item = inventoryItemsMap[itemId as InventoryItemIds];
                if (!item) continue;
                children.push(
                    requirementMaterialRow({
                        item,
                        amount,
                        onItemTap: props.onItemTap,
                    }),
                );
            }
        }

        if (requirements.special && requirements.special.length > 0) {
            children.push(uiSpace({ width: 1, height: 4 }));
            children.push(
                uiText({
                    content: "Special:",
                    textStyle: bookTextStyle,
                }),
            );

            for (const req of requirements.special) {
                const reqName = specialRequirementNames[req];
                children.push(
                    uiText({
                        content: `  ${reqName}`,
                        textStyle: bookTextStyle,
                    }),
                );
            }
        }

        return uiColumn({
            width: fillUiSize,
            height: wrapUiSize,
            children,
        });
    },
);

const buildingDetailsView = createComponent<{
    building: Building;
    onBuild: () => void;
    onItemTap?: (item: InventoryItem) => void;
}>(({ props }) => {
    const spriteDef = spriteRegistry.resolve(props.building.icon);
    const spriteW = spriteDef?.[SPRITE_W] ?? 16;
    const spriteH = spriteDef?.[SPRITE_H] ?? 16;
    const scale = props.building.previewScale ?? Math.ceil(160 / spriteH);
    // Default gap between sprite art and the bottom border of the preview box.
    // Buildings whose sprites have transparent bottom rows (e.g. gate) should set previewOffset: 0.
    const previewOffset = props.building.previewOffset ?? 16;

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
                    height: 140,
                    background: ninePatchBackground({
                        sprite: spriteRefs.book_grid_item,
                        sides: allSides(8),
                        scale: 1,
                    }),
                    child: uiColumn({
                        width: wrapUiSize,
                        height: wrapUiSize,
                        children: [
                            uiImage({
                                sprite: props.building.icon,
                                width: spriteW * scale,
                                height: spriteH * scale,
                            }),
                            uiSpace({
                                width: 1,
                                height: previewOffset,
                            }),
                        ],
                    }),
                }),
                uiSpace({ width: 1, height: 8 }),
                uiText({
                    content: props.building.name,
                    textStyle: bookTitleStyle,
                }),
                uiSpace({ width: 1, height: 8 }),
                buildingRequirementsView({
                    building: props.building,
                    onItemTap: props.onItemTap,
                }),
                uiSpace({ width: 1, height: fillUiSize }),
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
    onItemTap?: (item: InventoryItem) => void;
}>(({ props }) => {
    const masterView = buildingMasterView({
        buildings: props.activeBuildings,
        onBuildingSelect: props.onBuildingSelect,
    });

    const detailsView = buildingDetailsView({
        building: props.selectedBuilding,
        onBuild: props.onBuild,
        onItemTap: props.onItemTap,
    });

    return uiBookLayout({
        leftPage: masterView,
        rightPage: detailsView,
        tabs: [
            {
                icon: spriteRefs.wood_resource,
                isSelected: props.selectedTab === 0,
                onTap: () => props.onTabSelect(0),
            },
            {
                icon: spriteRefs.stone,
                isSelected: props.selectedTab === 1,
                onTap: () => props.onTabSelect(1),
            },
            {
                icon: spriteRefs.gold_coins,
                isSelected: props.selectedTab === 2,
                onTap: () => props.onTabSelect(2),
            },
            {
                icon: spriteRefs.resource_corn,
                isSelected: props.selectedTab === 3,
                onTap: () => props.onTabSelect(3),
            },
            {
                icon: spriteRefs.building_mill,
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
            onItemTap: (item) => {
                this.context.stateChanger.push(new ItemSourceState(item));
            },
        });

        return uiScaffold({
            content: scaffoldContent,
            leftButtons: [
                {
                    text: "Build",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => this.buildSelected(),
                },
                {
                    text: "Cancel",
                    icon: spriteRefs.empty_sprite,
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
        log.info("Build selected", { building: this._selectedBuilding });
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
