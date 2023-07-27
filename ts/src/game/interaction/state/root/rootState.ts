import { sprites2 } from "../../../../asset/sprite.js";
import { Bounds, boundsCenter } from "../../../../common/bounds.js";
import { Direction } from "../../../../common/direction.js";
import {
    Point,
    manhattanDistance,
    shiftPoint,
} from "../../../../common/point.js";
import { allSides } from "../../../../common/sides.js";
import { Camera } from "../../../../rendering/camera.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { FocusGroup } from "../../../../ui/focus/focusGroup.js";
import { uiAlignment } from "../../../../ui/uiAlignment.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { WorkerBehaviorComponent } from "../../../world/component/behavior/workerBehaviorComponent.js";
import { TilesComponent } from "../../../world/component/tile/tilesComponent.js";
import { SelectedEntityItem } from "../../../world/selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../world/selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem.js";
import { GroundTile } from "../../../world/tile/ground.js";
import { World } from "../../../world/world.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { LandUnlockState } from "../land/landUnlockState.js";
import { ActorSelectionState } from "../selection/actor/actorSelectionState.js";
import { SelectionState } from "../selection/selectionState.js";
import { BuildingState } from "./building/buildingState.js";
import { InventoryState } from "./inventory/inventoryState.js";
import { UITimeline } from "./ui/uiTimeline.js";

export class RootState extends InteractionState {
    override getFocusGroups(): FocusGroup[] {
        const groups: FocusGroup[] = [];
        if (!!this.view) {
            groups.push(this.view);
        }
        groups.push(
            new WorldFocusGroup(this.context.world, this.context.camera)
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
                text: "Land",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new LandUnlockState());
                },
            },
            {
                text: "Stash",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(new InventoryState());
                },
            },
            {
                text: "Quest",
                icon: sprites2.empty_sprite,
                onClick: () => {
                    this.context.stateChanger.push(
                        new AlertMessageState("Oh no", "Not implemented")
                    );
                },
            },
        ];

        const timeline = new UITimeline(this.context.gameTime, {
            width: fillUiSize,
            height: 48,
        });

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(16),
            alignment: uiAlignment.topCenter,
            children: [timeline],
        });

        const scaffoldState = new UIActionbarScaffold(
            contentView,
            actionItems,
            [],
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldState;
    }

    override onTileTap(tile: GroundTile): boolean {
        console.log("RootState tap: ", tile);
        let selection: SelectedWorldItem = new SelectedTileItem(tile);
        const entitiesAt = this.context.world.rootEntity.getEntityAt({
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
        } else {
            if (tile.hasTree) {
                this.context.stateChanger.push(new SelectionState(selection));
            }
        }

        return true;
    }
}

class WorldFocusGroup implements FocusGroup {
    private currentFocus: Bounds | null = null;
    constructor(private world: World, private camera: Camera) {}
    getFocusBounds(): Bounds | null {
        return this.currentFocus;
    }
    moveFocus(
        direction: Direction,
        currentFocusBounds: Bounds | null
    ): boolean {
        if (!currentFocusBounds) {
            return false;
        }

        const centerPosition = shiftPoint(
            boundsCenter(currentFocusBounds),
            direction,
            48
        );

        //TODO: Optimize finding the closest tile, no need to loop over all
        const worldPosition = this.camera.screenToWorld(centerPosition);
        const tilesComponent =
            this.world.rootEntity.requireComponent(TilesComponent);

        const tiles = tilesComponent.getTiles((tile) => true);
        let closestTile = tiles[0];
        let closestDistance = Number.MAX_SAFE_INTEGER;
        for (const tile of tiles) {
            const distance = manhattanDistance(
                {
                    x: tile.tileX,
                    y: tile.tileY,
                },
                worldPosition
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTile = tile;
            }
        }

        const screenPosition = this.camera.tileSpaceToScreenSpace({
            x: closestTile.tileX,
            y: closestTile.tileY,
        });

        this.currentFocus = {
            x1: screenPosition.x,
            y1: screenPosition.y,
            x2: screenPosition.x + 48,
            y2: screenPosition.y + 48,
        };

        return true;
    }
}
