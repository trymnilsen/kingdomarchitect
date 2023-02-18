import { sprites2 } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { RenderContext } from "../../../../rendering/renderContext";
import { TreeComponent } from "../../../world/component/resource/treeComponent";
import { SelectedEntityItem } from "../../../world/selection/selectedEntityItem";
import { SelectedTileItem } from "../../../world/selection/selectedTileItem";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem";
import { GroundTile } from "../../../world/tile/ground";
import { TileSize } from "../../../world/tile/tile";
import { InteractionState } from "../../handler/interactionState";
import { ActionButton, getActionbarView } from "../../view/actionbar";
import { ChopJobState } from "../resource/chopJopState";

export class SelectionState extends InteractionState {
    private selectedItem: SelectedWorldItem;

    constructor(selection: SelectedWorldItem) {
        super();
        this.selectedItem = selection;
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
        const entitiesAt = this.context.world.rootEntity.getEntityAt({
            x: tile.tileX,
            y: tile.tileY,
        });
        if (entitiesAt.length > 0) {
            this.selectedItem = new SelectedEntityItem(entitiesAt[0]);
        } else {
            this.selectedItem = new SelectedTileItem(tile);
        }
        console.log("Selection updated: ", this.selectedItem);

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

        context.drawNinePatchSprite({
            sprite: sprites2.cursor,
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

        if (actions.length == 0) {
            const rootEntity = this.context.world.rootEntity;
            const entities = rootEntity.getEntityAt(tilePosition);
            console.log(
                `Entities at: ${tilePosition.x} ${tilePosition.y}`,
                entities
            );

            if (entities.length > 0) {
                const treeEntity = entities.filter((entity) => {
                    const isTree = entity.getComponent(TreeComponent);
                    return !!isTree;
                });

                if (treeEntity.length > 0) {
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
            }
        }

        return actions;
    }

    private actionButtonPressed(actionId: string) {
        if (actionId == "chop") {
            const selectedTile = this.selectedItem;
            this.context.stateChanger.push(new ChopJobState(selectedTile));
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
}
