import type { Bounds } from "../../../common/bounds.ts";
import { Direction } from "../../../common/direction.ts";
import type { Point } from "../../../common/point.ts";
import type { Camera } from "../../../rendering/camera.ts";
import type { FocusGroup } from "../../../ui/focus/focusGroup.ts";
import { getTile, TileComponentId } from "../../component/tileComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { HalfTileSize, TileSize } from "../../map/tile.ts";
import type { WorldSelection } from "../selection/selectedWorldItem.ts";

// How close to the screen edge the selection may get before the camera
// follows it. Two tiles leaves some of what lies ahead visible.
const followMargin = TileSize * 2;

/**
 * The world as a place for focus. Selection follows focus here: whatever the
 * current state has selected is the focus, so the group keeps no position of
 * its own beyond where to start when nothing is selected.
 *
 * Every press on a world tile goes through {@link pressTile}, whether it came
 * from a tap or from the keys. An arrow press is a press on the neighbouring
 * tile and the action key presses the selected tile again, so the two inputs
 * can't drift apart, and a targeting state such as picking an attack target
 * gets keyboard support without knowing about it.
 */
export class WorldSelectionFocusGroup implements FocusGroup {
    private camera: Camera;
    private root: Entity;
    private currentSelection: () => WorldSelection | null;
    private onPress: (tile: Point) => void;
    // Only used while nothing is selected, so the next arrow press starts next
    // to where the player last pressed rather than at an arbitrary tile.
    private resumeTile: Point | null = null;

    /**
     * @param currentSelection what the active state has selected right now
     * @param onPress applies a press on a tile to the active state
     */
    constructor(
        camera: Camera,
        root: Entity,
        currentSelection: () => WorldSelection | null,
        onPress: (tile: Point) => void,
    ) {
        this.camera = camera;
        this.root = root;
        this.currentSelection = currentSelection;
        this.onPress = onPress;
    }

    /** Presses a tile, as a tap on it or a key moving onto it does. */
    pressTile(tile: Point): void {
        this.resumeTile = tile;
        this.onPress(tile);
    }

    focusedBounds(): Bounds | null {
        const selection = this.currentSelection();
        if (!selection) {
            return null;
        }
        const screen = this.camera.tileSpaceToScreenSpace(
            selection.tilePosition,
        );
        return {
            x1: screen.x,
            y1: screen.y,
            x2: screen.x + selection.selectionSize.x * TileSize,
            y2: screen.y + selection.selectionSize.y * TileSize,
        };
    }

    enterFocus(near: Bounds | null): boolean {
        // Entering only decides where the next arrow press starts. Selecting
        // here would make switching domains change the game.
        if (!this.currentSelection() && near) {
            this.resumeTile = this.camera.worldSpaceToTileSpace(
                this.camera.screenToWorld({
                    x: (near.x1 + near.x2) / 2,
                    y: (near.y1 + near.y2) / 2,
                }),
            );
        }
        return true;
    }

    moveFocus(direction: Direction): boolean {
        const selection = this.currentSelection();
        const from = selection?.tilePosition ?? this.startTile();
        const size = selection?.selectionSize ?? { x: 1, y: 1 };
        const target = stepOffSelection(from, size, direction);

        // The keys only walk on land. A tap can still reach past it.
        const tileComponent = this.root.getEcsComponent(TileComponentId);
        if (!tileComponent || !getTile(tileComponent, target)) {
            return false;
        }

        this.keepInView(target);
        this.pressTile(target);
        return true;
    }

    activateFocused(): boolean {
        const selection = this.currentSelection();
        if (!selection) {
            return false;
        }
        this.pressTile(selection.tilePosition);
        return true;
    }

    blurFocus(): void {
        // The selection is game state, so handing the keys elsewhere must not
        // clear it. Only the state, or the back key, ends a selection.
    }

    /**
     * Where an arrow press starts when nothing is selected: the last pressed
     * tile while it is still in view. Once the player has panned away, the
     * screen centre, so the camera doesn't jump back to an old spot.
     */
    private startTile(): Point {
        if (this.resumeTile && this.isWithinScreen(this.resumeTile, 0)) {
            return this.resumeTile;
        }
        return this.camera.worldSpaceToTileSpace(this.camera.position);
    }

    /** Centres the camera on the tile when it gets close to the screen edge. */
    private keepInView(tile: Point): void {
        if (!this.isWithinScreen(tile, followMargin)) {
            const world = this.camera.tileSpaceToWorldSpace(tile);
            this.camera.position = {
                x: world.x + HalfTileSize,
                y: world.y + HalfTileSize,
            };
        }
    }

    /** Whether the whole tile is on screen, at least `margin` from the edges. */
    private isWithinScreen(tile: Point, margin: number): boolean {
        const screen = this.camera.tileSpaceToScreenSpace(tile);
        const screenSize = this.camera.windowSize;
        return (
            screen.x >= margin &&
            screen.y >= margin &&
            screen.x + TileSize <= screenSize.x - margin &&
            screen.y + TileSize <= screenSize.y - margin
        );
    }
}

/**
 * The tile just past the selection's edge in the direction. Stepping from the
 * edge rather than the origin keeps a selection wider than one tile from
 * landing on itself.
 */
function stepOffSelection(
    origin: Point,
    size: Point,
    direction: Direction,
): Point {
    switch (direction) {
        case Direction.Left:
            return { x: origin.x - 1, y: origin.y };
        case Direction.Right:
            return { x: origin.x + size.x, y: origin.y };
        case Direction.Up:
            return { x: origin.x, y: origin.y - 1 };
        case Direction.Down:
            return { x: origin.x, y: origin.y + size.y };
    }
}
