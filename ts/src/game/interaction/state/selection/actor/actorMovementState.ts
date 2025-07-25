import { Point } from "../../../../../common/point.js";
import { allSides } from "../../../../../common/sides.js";
import { sprites2 } from "../../../../../module/asset/sprite.js";
import { GroundTile, TileSize } from "../../../../../module/map/tile.js";
import { SearchedNode } from "../../../../../module/path/search.js";
import { queryPath } from "../../../../../module/query/pathQuery.js";
import { RenderScope } from "../../../../../rendering/renderScope.js";
import type { ComponentDescriptor } from "../../../../../module/ui/declarative/ui.js";
import { makeQueueJobAction } from "../../../../action/job/queueJobAction.js";
import { Entity } from "../../../../entity/entity.js";
import type { MoveToJob } from "../../../../job/moveToPointJob.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { uiScaffold } from "../../../view/uiScaffold.js";

export class ActorMovementState extends InteractionState {
    private selectedPoint: Point | null = null;
    private path: Point[] = [];
    private graph: SearchedNode[] = [];

    override get stateName(): string {
        return "Confirm movement";
    }

    constructor(private entity: Entity) {
        super();
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    text: "Confirm",
                    onClick: () => {
                        this.scheduleMovement();
                        this.context.stateChanger.pop(null);
                    },
                },
                {
                    text: "Cancel",
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
        });
    }

    override onTileTap(tile: GroundTile): boolean {
        const toPoint = {
            x: tile.tileX,
            y: tile.tileY,
        };
        this.selectedPoint = toPoint;

        const path = queryPath(
            this.context.root,
            this.entity.worldPosition,
            toPoint,
        );

        this.path = path.path;
        this.graph = path.graph;

        return true;
    }

    override onDraw(context: RenderScope): void {
        for (const pathPoint of this.path) {
            context.drawRectangle({
                x: pathPoint.x * TileSize + 14,
                y: pathPoint.y * TileSize + 14,
                width: 8,
                height: 8,
                fill: "pink",
            });
        }

        if (this.selectedPoint) {
            const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
                this.selectedPoint,
            );

            context.drawNinePatchSprite({
                sprite: sprites2.cursor,
                height: TileSize,
                width: TileSize,
                scale: 1.0,
                sides: allSides(12.0),
                x: cursorWorldPosition.x,
                y: cursorWorldPosition.y,
            });
        }

        for (const searchedNode of this.graph) {
            const position = context.camera.tileSpaceToScreenSpace({
                x: searchedNode.x,
                y: searchedNode.y,
            });

            const withinTheViewport =
                position.x + 40 > 0 &&
                position.y + 40 > 0 &&
                position.x - 40 < context.width &&
                position.y - 40 < context.height;

            if (!withinTheViewport) {
                continue;
            }

            if (searchedNode.visited) {
                context.drawScreenSpaceRectangle({
                    x: position.x,
                    y: position.y,
                    width: 4,
                    height: 4,
                    fill: "white",
                });
            }
            if (searchedNode.weight == 0) {
                context.drawScreenSpaceRectangle({
                    x: position.x + 8,
                    y: position.y,
                    width: 4,
                    height: 4,
                    fill: "red",
                });
            }

            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y,
                text: `w: ${searchedNode.weight}`,
            });
            /*
            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y + 16,
                text: `g: ${searchedNode.g}`,
            });
            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y + 24,
                text: `c: ${searchedNode.totalCost.toFixed(2)}`,
            });*/
        }

        super.onDraw(context);
    }

    private scheduleMovement() {
        if (this.context.root.actionDispatch && this.selectedPoint) {
            const job: MoveToJob = {
                id: "moveToJob",
                position: this.selectedPoint,
                path: [],
            };

            this.context.root.actionDispatch(
                makeQueueJobAction(job, this.entity),
            );
        }
    }
}
