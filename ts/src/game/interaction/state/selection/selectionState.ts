import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { RenderContext } from "../../../../rendering/renderContext";
import { GroundTile } from "../../../world/tile/ground";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { ActorActionsState } from "../actorActionsState";
import { BuildMenuState } from "../building/buildMenuState";
import {
    PossibleSelectedBuilding,
    SelectedBuildingUiAction,
    SelectedBuildingUiActionType,
} from "../building/selectedBuildingUiAction";
import { MoveState } from "../moveState";
import { ChopJobState } from "../resource/chopJopState";
import { SelectedItem, TileSelectedItem } from "./selectedItem";

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
        const tileSelection = new TileSelectedItem(tile);
        this.selectedItem = tileSelection;
        //TODO: add this back
        /*const actor = this.context.world.actors.getActor({
            x: tile.tileX,
            y: tile.tileY,
        });


        if (!!actor) {
            const actorSelection = new ActorSelectedItem(actor);
            this.selectedItem = actorSelection;
        } else {
            let entity = this.context.world.entities.getTile({
                x: tile.tileX,
                y: tile.tileY,
            });

            if (entity instanceof MultiTileEntity && !!entity.multiTileSource) {
                const sourceEntity = this.context.world.entities.getTileById(
                    entity.multiTileSource
                );
                if (!!sourceEntity) {
                    entity = sourceEntity;
                } else {
                    console.error(
                        "Tapped entity had reference to multitile not found"
                    );
                }
            }

            if (!!entity) {
                const size = this.context.world.entities.getSize(entity);
                console.log(`building size`, size);
                this.selectedItem = new EntitySelectedItem(entity, size);
            } else {
                
            }
        }

        */

        this.updateTileActions();
        return true;
    }

    override onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(
            this.selectedItem.tilePosition
        );
        const bounds = this.selectedItem.selectionSize;
        const cursorWidth = bounds.x * TileSize;
        const cursorHeight = bounds.y * TileSize;

        context.drawNinePatchImage({
            asset: "cursor",
            height: cursorHeight,
            width: cursorWidth,
            scale: 1.0,
            sides: allSides(12.0),
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
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
        /*
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
        */

        const tile = this.context.world.ground.getTile(tilePosition);
        let actions: ActionButton[] = [];
        if (tile && tile.hasTree) {
            actions = [
                {
                    id: "chop",
                    name: "Chop",
                },
                {
                    id: "cancel",
                    name: "Cancel",
                },
            ];
        }

        const rootEntity = this.context.world.rootEntity;
        const entities = rootEntity.getEntityAt(tilePosition);
        console.log(
            `Entities at: ${tilePosition.x} ${tilePosition.y}`,
            entities
        );
        return actions;
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
                this.context.stateChanger.push(new ChopJobState(selectedTile));
            }
        } else if (actionId == "actions") {
            this.context.stateChanger.push(new ActorActionsState());
        } else if (actionId == "cancel") {
            this.context.stateChanger.pop(null);
        } /*else if (actionId == "collect_coin") {
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
        }*/
    }

    private onBuildSelected(buildType: PossibleSelectedBuilding) {
        console.log("Build was selected");
        if (buildType == "woodenHouse") {
            //TODO: Add back building
            console.log("Build house");
            /* this.context.world.entities.add(
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
            } */
        } else if (buildType == "walls") {
            //TODO: Add back walls
            console.log("Build walls");
            /*
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
            */
        }
    }
}
