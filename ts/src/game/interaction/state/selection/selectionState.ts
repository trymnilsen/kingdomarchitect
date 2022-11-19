import { sprites } from "../../../../asset/sprite";
import { stoneWoodWalls } from "../../../../asset/sprites/stoneWoodWalls";
import {
    woodenHouseScaffold,
    woodenHouseSprite,
} from "../../../../asset/sprites/woodHouseSprite";
import { Point } from "../../../../common/point";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { CoinActor } from "../../../actor/actors/coinActor";
import { BuildJob } from "../../../actor/jobs/buildJob";
import { ChopTreeJob } from "../../../actor/jobs/chopTreeJob";
import { CollectCoinJob } from "../../../actor/jobs/collectCoinJob";
import { SwordsmanActor } from "../../../actor/actors/swordsmanActor";
import { BuildableEntity } from "../../../entity/buildableEntity";
import { WallEntity } from "../../../entity/building/wallEntity";
import { GroundTile } from "../../../entity/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { ActorActionsState } from "../actorActionsState";
import { BuildMenuState } from "../building/buildMenuState";
import {
    PossibleSelectedBuilding,
    SelectedBuildingUiAction,
    SelectedBuildingUiActionType,
} from "../building/selectedBuildingUiAction";
import { MoveState } from "../moveState";
import {
    ActorSelectedItem,
    SelectedItem,
    TileSelectedItem,
} from "./selectedItem";

export class SelectionState extends InteractionState {
    private selectedItem: SelectedItem;

    constructor(tile: SelectedItem) {
        super();
        this.selectedItem = tile;
    }

    override onActive(): void {
        this.updateTileActions();
    }

    /* 
    onTap(screenPosition: Point): boolean {
        if (this.actionbar) {
            const hitResult = onTapLayout(this.actionbar, screenPosition);
            if (!hitResult.handled) {
                //If the tap was not in our layout return false early
                return false;
            }
        }

        if (stateChanger.hasOperations) {
            return true;
        } else {
            return false;
        }
    } */

    override onTileTap(tile: GroundTile): boolean {
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

    override onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace(
            this.selectedItem.tilePosition
        );

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 3,
            y: cursorWorldPosition.y + 3,
        });

        super.onDraw(context);
    }

    private updateTileActions() {
        const actions = this.getTileActions(this.selectedItem.tilePosition);
        const actionbarView = getActionbarView(actions, (action) => {
            this.actionButtonPressed(action.id);
        });

        this.view = actionbarView;
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
            } else if (actor instanceof CoinActor) {
                return [
                    {
                        id: "collect_coin",
                        name: "Collect",
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

    private actionButtonPressed(actionId: string) {
        if (actionId == "build") {
            this.context.stateChanger.push(new BuildMenuState(), (value) => {
                console.log("Pop callback from build");
                if (
                    value &&
                    typeof value == "object" &&
                    value["type"] == SelectedBuildingUiActionType
                ) {
                    this.onBuildSelected(
                        (value as SelectedBuildingUiAction).data.build
                    );
                }
            });
        } else if (actionId == "move") {
            this.context.stateChanger.push(
                new MoveState(this.selectedItem.tilePosition)
            );
        } else if (actionId == "chop") {
            const selectedTile = this.selectedItem;
            if (selectedTile instanceof TileSelectedItem) {
                this.context.world.jobQueue.schedule(
                    new ChopTreeJob(selectedTile.tile)
                );
            }

            this.context.stateChanger.pop(null);
        } else if (actionId == "actions") {
            this.context.stateChanger.push(new ActorActionsState());
        } else if (actionId == "cancel") {
            this.context.stateChanger.pop(null);
        } else if (actionId == "collect_coin") {
            const selectedTile = this.selectedItem;
            const coin = this.context.world.actors.getActor(
                selectedTile.tilePosition
            );
            if (coin instanceof CoinActor) {
                this.context.world.jobQueue.schedule(
                    new CollectCoinJob(selectedTile.tilePosition)
                );
            }

            this.context.stateChanger.pop(null);
        }
    }

    private onBuildSelected(buildType: PossibleSelectedBuilding) {
        console.log("Build was selected");
        if (buildType == "woodenHouse") {
            this.context.world.entities.add(
                new BuildableEntity(
                    this.selectedItem.tilePosition,
                    woodenHouseScaffold,
                    { x: 2, y: 2 },
                    woodenHouseSprite,
                    { x: 2, y: 2 }
                )
            );
            this.context.world.invalidateWorld();
            if (this.selectedItem instanceof TileSelectedItem) {
                this.context.world.jobQueue.schedule(
                    new BuildJob(this.selectedItem.tile)
                );
            }
        } else if (buildType == "walls") {
            this.context.world.entities.add(
                new WallEntity(
                    this.selectedItem.tilePosition,
                    stoneWoodWalls,
                    { x: 2, y: 2 },
                    stoneWoodWalls,
                    { x: 2, y: 2 }
                )
            );
            this.context.world.invalidateWorld();
            if (this.selectedItem instanceof TileSelectedItem) {
                this.context.world.jobQueue.schedule(
                    new BuildJob(this.selectedItem.tile)
                );
            }
        }
    }
}
