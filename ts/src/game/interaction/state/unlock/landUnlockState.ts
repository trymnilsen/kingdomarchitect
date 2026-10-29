import { Direction } from "../../../../common/direction.ts";
import {
    encodePosition,
    multiplyPoint,
    type Point,
    pointEquals,
    shiftPoint,
} from "../../../../common/point.ts";
import { allSides } from "../../../../common/sides.ts";
import { spriteRefs } from "../../../../asset/sprite.ts";
import {
    ChunkDimension,
    ChunkSize,
    getChunkPosition,
} from "../../../map/chunk.ts";
import { TileSize } from "../../../map/tile.ts";
import { RenderScope } from "../../../../rendering/renderScope.ts";
import { hasChunk, TileComponentId } from "../../../component/tileComponent.ts";
import {
    hasDiscoveredChunk,
    VisibilityMapComponentId,
} from "../../../component/visibilityMapComponent.ts";
import { InteractionState } from "../../handler/interactionState.ts";

export class LandUnlockState extends InteractionState {
    private unlockPoints: Point[] = [];
    private cursor: Point | null = null;
    override get stateName(): string {
        return "Unlock Land";
    }

    constructor() {
        super();
        /*
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            [
                {
                    text: "Unlock",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        this.unlockSelected();
                    },
                },
                {
                    text: "Cancel",
                    icon: spriteRefs.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
            [],
            { width: fillUiSize, height: fillUiSize },
        );*/

        //this.view = scaffoldView;
    }

    override onActive(): void {
        super.onActive();
        this.setUnlockableChunks();
    }

    // Unlockable chunks have no land yet, so presses are matched by position
    override onTilePress(position: Point): boolean {
        const chunk = getChunkPosition(position.x, position.y);
        const unlockTap = this.unlockPoints.find((point) =>
            pointEquals(point, multiplyPoint(chunk, ChunkDimension)),
        );

        this.cursor = unlockTap ?? null;
        return !!unlockTap;
    }

    private unlockSelected() {
        if (this.cursor) {
            const _chunkPoint = {
                x: Math.floor(this.cursor.x / ChunkSize / TileSize),
                y: Math.floor(this.cursor.y / ChunkSize / TileSize),
            };

            //this.context.root.dispatchAction(makeUnlockChunkAction(chunkPoint));
            //this.context.stateChanger.pop();
            this.setUnlockableChunks();
        }
    }

    private setUnlockableChunks() {
        const tileComponent =
            this.context.root.requireEcsComponent(TileComponentId);
        const visibilityMap = this.context.root.getEcsComponent(
            VisibilityMapComponentId,
        );

        const chunks = tileComponent.chunks;
        const unlockablePositions = new Set<number>();
        this.unlockPoints = [];
        const addChunkPosition = (point: Point) => {
            const asEncoded = encodePosition(point.x, point.y);
            if (
                !unlockablePositions.has(asEncoded) &&
                !hasChunk(tileComponent, point)
            ) {
                unlockablePositions.add(asEncoded);
                this.unlockPoints.push({
                    x: point.x * ChunkDimension,
                    y: point.y * ChunkDimension,
                });
            }
        };

        for (const [key, chunk] of chunks) {
            // Chunks can exist client side without being discovered. The
            // unlock ring should only grow from land the player has explored
            if (
                visibilityMap &&
                !hasDiscoveredChunk(
                    visibilityMap,
                    encodePosition(chunk.chunkX, chunk.chunkY),
                )
            ) {
                continue;
            }
            const left = shiftPoint(
                { x: chunk.chunkX, y: chunk.chunkY },
                Direction.Left,
                1,
            );

            const right = shiftPoint(
                { x: chunk.chunkX, y: chunk.chunkY },
                Direction.Right,
                1,
            );

            const up = shiftPoint(
                { x: chunk.chunkX, y: chunk.chunkY },
                Direction.Up,
                1,
            );

            const down = shiftPoint(
                { x: chunk.chunkX, y: chunk.chunkY },
                Direction.Down,
                1,
            );

            addChunkPosition(left);
            addChunkPosition(right);
            addChunkPosition(up);
            addChunkPosition(down);
        }

        if (this.unlockPoints.length > 0) {
            this.cursor = this.unlockPoints[0];
        }
    }

    override onDraw(context: RenderScope): void {
        for (const point of this.unlockPoints) {
            for (let x = 0; x < ChunkSize; x++) {
                const tx = point.x + x * TileSize;
                for (let y = 0; y < ChunkSize; y++) {
                    const ty = point.y + y * TileSize;
                    context.drawRectangle({
                        x: tx + 3,
                        y: ty + 3,
                        width: 32,
                        height: 32,
                        fill: "#49275e",
                    });
                }
            }
        }
        if (this.cursor) {
            context.drawNinePatchSprite({
                sprite: spriteRefs.cursor,
                height: ChunkDimension,
                width: ChunkDimension,
                scale: 1.0,
                sides: allSides(12.0),
                x: context.camera.worldToScreenX(this.cursor.x),
                y: context.camera.worldToScreenY(this.cursor.y),
            });
        }

        super.onDraw(context);
    }
}
