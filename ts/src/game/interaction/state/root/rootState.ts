import { Bounds, boundsCenter } from "../../../../common/bounds.js";
import { Direction } from "../../../../common/direction.js";
import { shiftPoint } from "../../../../common/point.js";
import { Camera } from "../../../../rendering/camera.js";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.js";
import { FocusGroup } from "../../../../ui/focus/focusGroup.js";
import { Entity } from "../../../entity/entity.js";
import { GroundTile, TileSize } from "../../../map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { uiScaffold } from "../../view/uiScaffold.js";
import { AlertMessageState } from "../common/alertMessageState.js";
import { MenuState } from "../menu/menuState.js";

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
                    text: "Quest",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState(
                                "Quest",
                                "Not implemented yet",
                            ),
                        );
                    },
                },
                {
                    text: "Map",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState("Map", "Not implemented yet"),
                        );
                    },
                },
            ],
            rightButtons: [
                {
                    text: "Menu",
                    onClick: () => {
                        this.context.stateChanger.push(new MenuState());
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
