import { sprites } from "../../../asset/sprite";
import { withinRectangle } from "../../../common/bounds";
import { Point } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { drawLayout, onTapLayout } from "../../../ui/layout/layout";
import { LayoutNode } from "../../../ui/layout/layoutNode";
import { actionbarView, ActionButton } from "../../../ui/view/actionbar";
import { ChopTreeJob } from "../../actor/jobs/chopTreeJob";
import { SwordsmanActor } from "../../actor/swordsmanActor";
import { woodHouseEntity } from "../../entity/building/woodenHouseEntity";
import { GroundTile } from "../../entity/ground";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";
import { ActorActionsState } from "./actorActionsState";
import { BuildMenuState } from "./buildMenuState";
import { MoveState } from "./moveState";

export class TileSelectedState extends InteractionState {
    private selectedTile: GroundTile;
    private actions: ActionButton[] = [];
    private actionbar: LayoutNode | null = null;

    constructor(tile: GroundTile) {
        super();
        this.selectedTile = tile;
    }

    onActive(): void {
        this.updateTileActions();
    }

    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        if (this.actionbar) {
            const hitResult = onTapLayout(this.actionbar, screenPosition);
            if (!hitResult.handled) {
                //If the tap was not in our layout return false early
                return false;
            }

            if (hitResult.data == "build") {
                stateChanger.push(new BuildMenuState(), (value) => {
                    console.log("Pop callback from build");
                    if (value == true) {
                        this.onBuildSelected();
                    }
                });
            } else if (hitResult.data == "move") {
                stateChanger.push(
                    new MoveState({
                        x: this.selectedTile.tileX,
                        y: this.selectedTile.tileY,
                    })
                );
            } else if (hitResult.data == "chop") {
                this.context.world.jobQueue.schedule(
                    new ChopTreeJob(this.selectedTile)
                );
                stateChanger.pop(null);
            } else if (hitResult.data == "actions") {
                stateChanger.push(new ActorActionsState());
            } else if (hitResult.data == "cancel") {
                stateChanger.pop(null);
            }
        }

        if (stateChanger.hasOperations) {
            return true;
        } else {
            return false;
        }
    }

    onTileTap(
        tile: GroundTile,
        stateChanger: InteractionStateChanger
    ): boolean {
        // If a new tile was tapped while in this state we move the cursor to it
        console.log("TileSelectedState - onTileTap: ", tile);
        this.selectedTile = tile;
        this.updateTileActions();
        return true;
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selectedTile.tileX,
            y: this.selectedTile.tileY,
        });

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 2,
            y: cursorWorldPosition.y + 2,
        });

        this.actionbar = actionbarView(context, this.actions);
        drawLayout(context, this.actionbar);
    }

    private updateTileActions() {
        this.actions = this.getTileActions({
            x: this.selectedTile.tileX,
            y: this.selectedTile.tileY,
        });
    }

    private getTileActions(tilePosition: Point): ActionButton[] {
        const actor = this.context.world.actors.getActor(tilePosition);
        if (actor) {
            if (actor instanceof SwordsmanActor) {
                return [
                    {
                        id: "actions",
                        name: "Actions",
                    },
                    {
                        id: "move",
                        name: "Move",
                    },
                    {
                        id: "cancel",
                        name: "Cancel",
                    },
                ];
            } else {
                return [
                    {
                        id: "info",
                        name: "Info",
                    },
                    {
                        id: "cancel",
                        name: "Cancel",
                    },
                ];
            }
        }

        const tile = this.context.world.ground.getTile(tilePosition);
        if (tile) {
            if (tile.hasTree) {
                return [
                    {
                        id: "chop",
                        name: "Chop",
                    },
                    {
                        id: "cancel",
                        name: "Cancel",
                    },
                ];
            } else {
                return [
                    {
                        id: "build",
                        name: "Build",
                    },
                    {
                        id: "cancel",
                        name: "Cancel",
                    },
                ];
            }
        }

        return [];
    }

    private onBuildSelected() {
        console.log("Build was selected");
        this.context.world.buildings.add(
            woodHouseEntity({
                x: this.selectedTile.tileX,
                y: this.selectedTile.tileY,
            })
        );
        this.context.world.invalidateWorld();
    }
}
