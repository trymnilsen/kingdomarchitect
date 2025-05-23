import { sprites2 } from "../../../../module/asset/sprite.js";
import { Bounds, boundsCenter } from "../../../../common/bounds.js";
import { Direction } from "../../../../common/direction.js";
import { manhattanDistance, shiftPoint } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Camera } from "../../../../rendering/camera.js";
import { uiBox } from "../../../../module/ui/dsl/uiBoxDsl.js";
import { FocusGroup } from "../../../../module/ui/focus/focusGroup.js";
import { uiAlignment } from "../../../../module/ui/uiAlignment.js";
import { fillUiSize } from "../../../../module/ui/uiSize.js";
import { Entity } from "../../../entity/entity.js";
import { SelectedEntityItem } from "../../../../module/selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../../module/selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../../module/selection/selectedWorldItem.js";
import { GroundTile } from "../../../../module/map/tile.js";
import { HalfTileSize, TileSize } from "../../../../module/map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { MenuState } from "../menu/menuState.js";
import { BuildingState } from "./building/buildingState.js";
import { InventoryState } from "./inventory/inventoryState.js";
import { ScrollInteractionState } from "../scrolls/scrollState.js";
import { LandUnlockState } from "../unlock/landUnlockState.js";

export class RootState extends InteractionState {
    override getFocusGroups(): FocusGroup[] {
        const groups: FocusGroup[] = [];
        if (this.view) {
            groups.push(this.view);
        }
        groups.push(
            new WorldFocusGroup(this.context.root, this.context.camera),
        );

        return groups;
    }
    override onActive(): void {
        super.onActive();

        const actionItems: UIActionbarItem[] = [
            {
                text: "Quest",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Oh no", "Not implemented"),
                    );
                },
            },
            {
                text: "Scroll",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new ScrollInteractionState(),
                    );
                },
            },
            {
                text: "Map",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Oh no", "Not implemented"),
                    );
                },
            },
            {
                text: "Land",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new LandUnlockState());
                },
            },
        ];

        const rightActionItems: UIActionbarItem[] = [
            {
                text: "Menu",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new MenuState());
                },
            },
        ];

        /*
        const timeline = new UITimeline(this.context.gameTime, {
            width: fillUiSize,
            height: 48,
        });*/

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(16),
            alignment: uiAlignment.topCenter,
            children: [],
        });

        const scaffoldState = new UIActionbarScaffold(
            contentView,
            actionItems,
            rightActionItems,
            { width: fillUiSize, height: fillUiSize },
        );

        this.view = scaffoldState;
    }

    override onTileTap(tile: GroundTile): boolean {
        console.log("RootState tap: ", tile);
        return false;
    }
}

class WorldFocusGroup implements FocusGroup {
    private currentFocus: GroundTile | null = null;
    constructor(
        private rootNode: Entity,
        private camera: Camera,
    ) {}

    onFocusActionInput(): boolean {
        return false;
    }

    getFocusBounds(): Bounds | null {
        if (!this.currentFocus) {
            return null;
        }

        const screenPosition = this.camera.tileSpaceToScreenSpace({
            x: this.currentFocus.tileX,
            y: this.currentFocus.tileY,
        });

        const bounds = {
            x1: screenPosition.x,
            y1: screenPosition.y,
            x2: screenPosition.x + TileSize,
            y2: screenPosition.y + TileSize,
        };
        return bounds;
    }

    moveFocus(
        direction: Direction,
        currentFocusBounds: Bounds | null,
    ): boolean {
        if (!currentFocusBounds) {
            return false;
        }

        const centerPosition = shiftPoint(
            boundsCenter(currentFocusBounds),
            direction,
            TileSize,
        );

        //TODO: Optimize finding the closest focusable tile, no need to loop over all of them
        const worldPosition = this.camera.screenToWorld(centerPosition);
        //const tilesComponent = this.rootNode.requireComponent(TilesComponent);
        //TODO: Reimplement moving the focus around
        /*
        const tiles = tilesComponent.getTiles(() => true);
        let closestTile = tiles[0];
        let closestDistance = Number.MAX_SAFE_INTEGER;
        for (const tile of tiles) {
            const distance = manhattanDistance(
                {
                    x: tile.tileX * TileSize + HalfTileSize,
                    y: tile.tileY * TileSize + HalfTileSize,
                },
                worldPosition,
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTile = tile;
            }
        }

        this.currentFocus = closestTile;
        */

        return true;
    }
}
