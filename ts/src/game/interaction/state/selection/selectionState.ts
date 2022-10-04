import { sprites } from "../../../../asset/sprite";
import { withinRectangle } from "../../../../common/bounds";
import { Point } from "../../../../common/point";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { drawLayout, onTapLayout } from "../../../../ui/v1/layout/layout";
import { LayoutNode } from "../../../../ui/v1/layout/layoutNode";
import { actionbarView, ActionButton } from "../../../../ui/v1/view/actionbar";
import { ChopTreeJob } from "../../../actor/jobs/chopTreeJob";
import { SwordsmanActor } from "../../../actor/swordsmanActor";
import { woodHouseEntity } from "../../../entity/building/woodenHouseEntity";
import { GroundTile } from "../../../entity/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { ActorActionsState } from "../actorActionsState";
import { BuildMenuState } from "../building/buildMenuState";
import { MoveState } from "../moveState";
import {
    ActorSelectedItem,
    SelectedItem,
    TileSelectedItem,
} from "./selectedItem";

export class SelectionState extends InteractionState {
    private selectedItem: SelectedItem;
    private actions: ActionButton[] = [];
    private actionbar: LayoutNode | null = null;

    constructor(tile: SelectedItem) {
        super();
        this.selectedItem = tile;
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
                    new MoveState(this.selectedItem.tilePosition)
                );
            } else if (hitResult.data == "chop") {
                const selectedTile = this.selectedItem;
                if (selectedTile instanceof TileSelectedItem) {
                    this.context.world.jobQueue.schedule(
                        new ChopTreeJob(selectedTile.tile)
                    );
                }

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

        const actor = this.context.world.actors.getActor({
            x: tile.tileX,
            y: tile.tileY,
        });

        if (!!actor) {
            const actorSelection = new ActorSelectedItem(actor);
            this.selectedItem = actorSelection;
        } else {
            const tileSelection = new TileSelectedItem(tile);
            this.selectedItem = tileSelection;
        }

        this.updateTileActions();
        return true;
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace(
            this.selectedItem.tilePosition
        );

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 3,
            y: cursorWorldPosition.y + 3,
        });

        this.actionbar = actionbarView(context, this.actions);
        drawLayout(context, this.actionbar);
    }

    private updateTileActions() {
        this.actions = this.getTileActions(this.selectedItem.tilePosition);
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
            woodHouseEntity(this.selectedItem.tilePosition)
        );
        this.context.world.invalidateWorld();
    }
}
