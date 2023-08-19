import { sprites2 } from "../../../../../asset/sprite.js";
import { Point } from "../../../../../common/point.js";
import { allSides } from "../../../../../common/sides.js";
import { SearchedNode } from "../../../../../path/search.js";
import { RenderContext } from "../../../../../rendering/renderContext.js";
import { uiBox } from "../../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../../ui/uiSize.js";
import { JobQueueComponent } from "../../../../component/job/jobQueueComponent.js";
import { PathFindingComponent } from "../../../../component/root/path/pathFindingComponent.js";
import { Entity } from "../../../../entity/entity.js";
import { EntityInstanceJobConstraint } from "../../../../component/job/constraint/entityInstanceConstraint.js";
import { GroundTile } from "../../../../tile/ground.js";
import { TileSize } from "../../../../tile/tile.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../../view/actionbar/uiActionbarScaffold.js";
import { MoveJob } from "../../../../component/job/jobs/moveJob.js";

export class ActorMovementState extends InteractionState {
    private selectedPoint: Point | null = null;
    private path: Point[] = [];
    private graph: SearchedNode[] = [];

    constructor(private entity: Entity) {
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
                    text: "Move",
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
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldView;
    }

    override onTileTap(tile: GroundTile): boolean {
        const toPoint = {
            x: tile.tileX,
            y: tile.tileY,
        };
        this.selectedPoint = toPoint;

        const path = this.context.root
            .requireComponent(PathFindingComponent)
            .findPath(this.entity.worldPosition, toPoint);

        this.graph = path.graph;
        this.path = path.path;

        return true;
    }

    override onDraw(context: RenderContext): void {
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
                this.selectedPoint
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
            if (searchedNode.visited) {
                context.drawScreenSpaceRectangle({
                    x: position.x,
                    y: position.y,
                    width: 4,
                    height: 4,
                    fill: "blue",
                });
            }
            if (searchedNode.weight == 0) {
                context.drawScreenSpaceRectangle({
                    x: position.x + 4,
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
                text: `c: ${searchedNode.totalCost}`,
            });

            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y + 12,
                text: `w: ${searchedNode.weight}`,
            });

            context.drawText({
                size: 12,
                font: "arial",
                color: "black",
                x: position.x,
                y: position.y + 24,
                text: `${searchedNode.x},${searchedNode.y}`,
            });
        }

        super.onDraw(context);
    }

    private scheduleMovement() {
        this.context.root
            .requireComponent(JobQueueComponent)
            .addJob(
                new MoveJob(
                    this.path,
                    new EntityInstanceJobConstraint(this.entity)
                )
            );
    }
}
