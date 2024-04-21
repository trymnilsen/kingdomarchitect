import { sprites2 } from "../../../../asset/sprite.js";
import { Bounds, boundsCenter } from "../../../../common/bounds.js";
import { Direction } from "../../../../common/direction.js";
import { manhattanDistance, shiftPoint } from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Camera } from "../../../../rendering/camera.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { FocusGroup } from "../../../../ui/focus/focusGroup.js";
import { uiAlignment } from "../../../../ui/uiAlignment.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { WorkerBehaviorComponent } from "../../../component/behavior/workerBehaviorComponent.js";
import { ChunkMapComponent } from "../../../component/root/chunk/chunkMapComponent.js";
import { TilesComponent } from "../../../component/tile/tilesComponent.js";
import { Entity } from "../../../entity/entity.js";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../selection/selectedWorldItem.js";
import { GroundTile } from "../../../map/tile.js";
import { HalfTileSize, TileSize } from "../../../map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { MenuState } from "../menu/menuState.js";
import { ActorSelectionState } from "../selection/actor/actorSelectionState.js";
import { SelectionState } from "../selection/selectionState.js";
import { BuildingState } from "./building/buildingState.js";
import { ConfirmEquipAction } from "./inventory/equipActions.js";
import { InventoryState } from "./inventory/inventoryState.js";
import { UITimeline } from "./ui/uiTimeline.js";

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
                text: "Build",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new BuildingState());
                },
            },
            {
                text: "Stash",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new InventoryState(new ConfirmEquipAction()),
                    );
                },
            },
            {
                text: "Quest",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Oh no", "Not implemented"),
                    );
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
        let selection: SelectedWorldItem = new SelectedTileItem(tile);
        const entitiesAt = this.context.root
            .requireComponent(ChunkMapComponent)
            .getEntityAt({
                x: tile.tileX,
                y: tile.tileY,
            });

        if (entitiesAt.length > 0) {
            const actor = entitiesAt[0];
            const behavior = actor.getComponent(WorkerBehaviorComponent);
            if (behavior) {
                this.context.stateChanger.push(new ActorSelectionState(actor));
            } else {
                selection = new SelectedEntityItem(entitiesAt[0]);
                this.context.stateChanger.push(new SelectionState(selection));
            }
        }

        return true;
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

        //TODO: Optimize finding the closest tile, no need to loop over all
        const worldPosition = this.camera.screenToWorld(centerPosition);
        const tilesComponent = this.rootNode.requireComponent(TilesComponent);

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

        return true;
    }
}
