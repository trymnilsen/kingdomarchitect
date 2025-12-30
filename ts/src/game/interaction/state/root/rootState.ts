import { Bounds, boundsCenter } from "../../../../common/bounds.ts";
import { Direction } from "../../../../common/direction.ts";
import { shiftPoint } from "../../../../common/point.ts";
import { Camera } from "../../../../rendering/camera.ts";
import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { FocusGroup } from "../../../../ui/focus/focusGroup.ts";
import { Entity } from "../../../entity/entity.ts";
import { GroundTile, TileSize } from "../../../map/tile.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { AlertMessageState } from "../common/alertMessageState.ts";
import { MenuState } from "../menu/menuState.ts";

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
    private rootNode: Entity;
    private camera: Camera;

    constructor(rootNode: Entity, camera: Camera) {
        this.rootNode = rootNode;
        this.camera = camera;
    }

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
