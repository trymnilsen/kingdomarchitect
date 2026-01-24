import { Point } from "../../../../../common/point.ts";
import { allSides } from "../../../../../common/sides.ts";
import { sprites2 } from "../../../../../asset/sprite.ts";
import { GroundTile, TileSize } from "../../../../map/tile.ts";
import { SearchedNode } from "../../../../map/path/search.ts";
import { queryPath } from "../../../../map/query/pathQuery.ts";
import { RenderScope } from "../../../../../rendering/renderScope.ts";
import type { ComponentDescriptor } from "../../../../../ui/declarative/ui.ts";
import { Entity } from "../../../../entity/entity.ts";
import { InteractionState } from "../../../handler/interactionState.ts";
import { uiScaffold } from "../../../view/uiScaffold.ts";
import { getPathfindingGraphForEntity } from "../../../../map/path/getPathfindingGraphForEntity.ts";
import { queryEntity } from "../../../../map/query/queryEntity.ts";
import type { SelectedWorldItem } from "../../../selection/selectedWorldItem.ts";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem.ts";
import { SelectedTileItem } from "../../../selection/selectedTileItem.ts";
import { WorkplaceComponentId } from "../../../../component/workplaceComponent.ts";
import { ChangeOccupationCommand } from "../../../../../server/message/command/changeOccupationCommand.ts";
import { BehaviorAgentComponentId } from "../../../../behavior/components/BehaviorAgentComponent.ts";
import { SetPlayerCommand } from "../../../../../server/message/command/setPlayerCommand.ts";

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
        const atPoint = queryEntity(this.context.root, toPoint);

        if (atPoint.length > 0) {
            this.currentSelection = new SelectedEntityItem(atPoint[0]);
            return true;
        } else {
            this.currentSelection = new SelectedTileItem(tile);
            // Get the pathfinding graph
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
        if (!this.selectedPoint) {
            return;
        }

        // Check if entity has Behavior agent component
        const behaviorAgent = this.entity.getEcsComponent(BehaviorAgentComponentId);
        if (!behaviorAgent) {
            console.warn(
                `Entity ${this.entity.id} does not have Behavior agent component`,
            );
            return;
        }

        // Dispatch command to server to set player command
        const command = SetPlayerCommand(this.entity.id, {
            action: "move",
            targetPosition: this.selectedPoint,
        });

        this.context.commandDispatcher(command);

        console.log(
            `[Player Command] Move command dispatched for ${this.entity.id} → ${this.selectedPoint.x},${this.selectedPoint.y}`,
        );
    }
}
