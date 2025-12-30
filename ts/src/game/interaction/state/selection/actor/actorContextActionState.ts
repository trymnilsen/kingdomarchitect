import { Point } from "../../../../../common/point.js";
import { allSides } from "../../../../../common/sides.js";
import { sprites2 } from "../../../../../asset/sprite.js";
import { GroundTile, TileSize } from "../../../../map/tile.js";
import { SearchedNode } from "../../../../map/path/search.js";
import { queryPath } from "../../../../map/query/pathQuery.js";
import { RenderScope } from "../../../../../rendering/renderScope.js";
import type { ComponentDescriptor } from "../../../../../ui/declarative/ui.js";
import { Entity } from "../../../../entity/entity.js";
import { MoveToJob } from "../../../../job/moveToPointJob.js";
import { InteractionState } from "../../../handler/interactionState.js";
import { uiScaffold } from "../../../view/uiScaffold.js";
import { QueueJobCommand } from "../../../../../server/message/command/queueJobCommand.js";
import { getPathfindingGraphForEntity } from "../../../../map/path/getPathfindingGraphForEntity.js";
import { queryEntity } from "../../../../map/query/queryEntity.js";
import { SpaceComponentId } from "../../../../component/spaceComponent.js";
import type { SelectedWorldItem } from "../../../selection/selectedWorldItem.js";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../selection/selectedTileItem.js";
import { CraftingComponentId } from "../../../../component/craftingComponent.js";
import { WorkplaceComponentId } from "../../../../component/workplaceComponent.js";
import { OccupationComponentId } from "../../../../component/occupationComponent.js";
import { removeItem } from "../../../../../common/array.js";
import { ChangeOccupationCommand } from "../../../../../server/message/command/changeOccupationCommand.js";

type ScaffoldButton = {
    text: string;
    onClick?: () => void;
    icon?: import("../../../../../asset/sprite.js").Sprite2;
    children?: ScaffoldButton[];
};

export class ActorContextActionState extends InteractionState {
    private selectedPoint: Point | null = null;
    private path: Point[] = [];
    private graph: SearchedNode[] = [];
    private currentSelection: SelectedWorldItem | null = null;
    private entity: Entity;

    override get stateName(): string {
        return "Confirm movement";
    }

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: this.getButtons(),
        });
    }

    private getButtons(): ScaffoldButton[] {
        const buttons: ScaffoldButton[] = [];

        // Add action button based on selection type
        if (this.currentSelection instanceof SelectedEntityItem) {
            const entity = this.currentSelection.entity;
            const workplaceComponent =
                entity.getEcsComponent(WorkplaceComponentId);

            if (workplaceComponent) {
                const worksAtPlace = workplaceComponent.workers.some(
                    (id) => id == this.entity.id,
                );
                if (!worksAtPlace) {
                    buttons.push({
                        text: "Assign",
                        onClick: () => {
                            this.context.commandDispatcher(
                                ChangeOccupationCommand(
                                    this.entity,
                                    entity,
                                    "assign",
                                ),
                            );
                            this.context.stateChanger.pop();
                        },
                    });
                } else {
                    buttons.push({
                        text: "Unassign",
                        onClick: () => {
                            this.context.commandDispatcher(
                                ChangeOccupationCommand(
                                    this.entity,
                                    entity,
                                    "unassign",
                                ),
                            );
                            this.context.stateChanger.pop();
                        },
                    });
                }
            }
        } else if (this.currentSelection instanceof SelectedTileItem) {
            buttons.push({
                text: "Move",
                onClick: () => {
                    this.scheduleMovement();
                    this.context.stateChanger.pop(null);
                },
            });
        }

        // Always add cancel button
        buttons.push({
            text: "Cancel",
            onClick: () => {
                this.context.stateChanger.pop(null);
            },
        });

        return buttons;
    }

    override onTileTap(tile: GroundTile): boolean {
        const toPoint = {
            x: tile.tileX,
            y: tile.tileY,
        };
        this.selectedPoint = toPoint;
        const atPoint = queryEntity(
            this.entity.requireAncestorEntity(SpaceComponentId),
            toPoint,
        );

        if (atPoint.length > 0) {
            this.currentSelection = new SelectedEntityItem(atPoint[0]);
            return true;
        } else {
            this.currentSelection = new SelectedTileItem(tile);
            // Get the pathfinding graph for the entity's space
            const pathfindingGraph = getPathfindingGraphForEntity(
                this.context.root,
                this.entity,
            );
            if (!pathfindingGraph) {
                return false;
            }

            const path = queryPath(
                pathfindingGraph,
                this.entity.worldPosition,
                toPoint,
            );

            this.path = path.path;
            this.graph = path.graph;

            return true;
        }
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

        if (window.debugChunks) {
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
        }

        super.onDraw(context);
    }

    private scheduleMovement() {
        //todo: send command via context to server
        //discover tiles on server
        //sender tiles back
        if (!this.selectedPoint) {
            return;
        }

        const job = MoveToJob(this.entity, this.selectedPoint);
        this.context.commandDispatcher(QueueJobCommand(job));
    }
}
