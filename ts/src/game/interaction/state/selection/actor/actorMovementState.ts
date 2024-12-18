import { sprites2 } from "../../../../../asset/sprite.js";
import { Point } from "../../../../../common/point.js";
import { allSides } from "../../../../../common/sides.js";
import { entityOf } from "../../../../../ecs/ecsComponent.js";
import { TransformComponent } from "../../../../../ecs/transformComponent.js";
import { SearchedNode } from "../../../../../path/searchResult.js";
import { RenderScope } from "../../../../../rendering/renderScope.js";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../../ui/uiSize.js";
import { JobQueueComponent } from "../../../../component/job/jobQueueComponent.js";
import { MoveJob } from "../../../../component/job/jobs/moveJob.js";
import { PathFindingComponent } from "../../../../component/root/path/pathFindingComponent.js";
import { JobComponent } from "../../../../ecsComponent/job/jobComponent.js";
import { makeMovementJob } from "../../../../ecsComponent/job/jobs/movementJob.js";
import { queryPath } from "../../../../ecsComponent/world/worldQuery.js";
import { GroundTile, TileSize } from "../../../../map/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";

export class ActorMovementState extends InteractionState {
    private selectedPoint: Point | null = null;
    private path: Point[] = [];
    private graph: SearchedNode[] = [];

    override get stateName(): string {
        return "Confirm movement";
    }

    constructor(private transform: TransformComponent) {
        super();
    }
    override onActive(): void {
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            [
                {
                    text: "Confirm",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.scheduleMovement();
                        this.context.stateChanger.pop(null);
                    },
                },
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
            [],
            { width: fillUiSize, height: fillUiSize },
        );

        this.view = scaffoldView;
    }

    override onTileTap(tile: GroundTile): boolean {
        const toPoint = {
            x: tile.tileX,
            y: tile.tileY,
        };
        this.selectedPoint = toPoint;

        const path = queryPath(
            this.context.world,
            this.transform.position,
            toPoint,
        );

        this.graph = path.graph;
        this.path = path.path;

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
        const jobComponent = this.context.world.components.getComponent(
            entityOf(this.transform),
            JobComponent,
        );
        if (!!jobComponent && !!this.selectedPoint) {
            jobComponent.jobs.push(
                makeMovementJob(this.selectedPoint, this.path),
            );
        }
    }
}
