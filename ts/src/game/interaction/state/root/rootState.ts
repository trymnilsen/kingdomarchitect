import { Bounds, boundsCenter } from "../../../../common/bounds.js";
import { Direction } from "../../../../common/direction.js";
import { shiftPoint } from "../../../../common/point.js";
import { bowItem } from "../../../../data/inventory/items/equipment.js";
import {
    bagOfGlitter,
    blueBook,
    woodResourceItem,
} from "../../../../data/inventory/items/resources.js";
import { GroundTile, TileSize } from "../../../../module/map/tile.js";
import type { ComponentDescriptor } from "../../../../module/ui/declarative/ui.js";
import { FocusGroup } from "../../../../module/ui/focus/focusGroup.js";
import { Camera } from "../../../../rendering/camera.js";
import { createInventoryComponent } from "../../../component/inventoryComponent.js";
import { Entity } from "../../../entity/entity.js";
import { InteractionState } from "../../handler/interactionState.js";
import { uiScaffold } from "../../view2/uiScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { MenuState } from "../menu/menuState.js";
import { InventoryState } from "./inventory/inventoryState.js";

export class RootState extends InteractionState {
    override getFocusGroups(): FocusGroup[] {
        return [new WorldFocusGroup(this.context.root, this.context.camera)];
        /*
        const groups: FocusGroup[] = [];
        if (this.view) {
            groups.push(this.view);
        }
        groups.push(
            ,
        );

        return groups;*/
    }
    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    label: "Move",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState(
                                "Move",
                                "Not implemented yet",
                            ),
                        );
                    },
                },
                {
                    label: "Stash",
                    onClick: () => {
                        const inventory = createInventoryComponent();
                        inventory.items = [
                            {
                                amount: 5,
                                item: bowItem,
                            },
                            {
                                amount: 54,
                                item: woodResourceItem,
                            },
                            {
                                amount: 432,
                                item: bagOfGlitter,
                            },
                            {
                                amount: 34,
                                item: blueBook,
                            },
                        ];
                        this.context.stateChanger.push(
                            new InventoryState(inventory),
                        );
                    },
                },
                {
                    label: "Skills",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState(
                                "Skills",
                                "Not implemented yet",
                            ),
                        );
                    },
                },
                {
                    label: "Stats",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState(
                                "Stats",
                                "Not implemented yet",
                            ),
                        );
                    },
                },
                {
                    label: "Close",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState("Close", "Nothing to close"),
                        );
                    },
                },
            ],
            rightButtons: [
                {
                    label: "Main",
                    onClick: () => {
                        this.context.stateChanger.push(new MenuState());
                    },
                },
                {
                    label: "Other",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState(
                                "Other",
                                "Other menu not implemented",
                            ),
                        );
                    },
                },
            ],
        });
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
