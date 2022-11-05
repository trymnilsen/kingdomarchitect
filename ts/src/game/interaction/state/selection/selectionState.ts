import { sprites } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { subTitleTextStyle } from "../../../../rendering/text/textStyle";
import { ninePatchBackground } from "../../../../ui/dsl/uiBackgroundDsl";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { uiButton } from "../../../../ui/dsl/uiButtonDsl";
import { uiColumn } from "../../../../ui/dsl/uiColumnDsl";
import { RowChild, uiRow } from "../../../../ui/dsl/uiRowDsl";
import { uiText } from "../../../../ui/dsl/uiTextDsl";
import { uiAlignment } from "../../../../ui/uiAlignment";
import { fillUiSize, UIView, wrapUiSize } from "../../../../ui/uiView";
import { ActionButton } from "../../../../ui/v1/view/actionbar";
import { BuildJob } from "../../../actor/jobs/buildJob";
import { ChopTreeJob } from "../../../actor/jobs/chopTreeJob";
import { SwordsmanActor } from "../../../actor/swordsmanActor";
import { woodHouseScaffold } from "../../../entity/building/woodenHouseEntity";
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
        const actionbarView = this.getActionbarView(actions);
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

    private getActionbarView(actions: ActionButton[]): UIView {
        const actionbarButton = (action: ActionButton): RowChild => {
            return {
                child: uiColumn({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: [
                        {
                            child: uiButton({
                                width: 48,
                                height: 48,
                                onTapCallback: () => {
                                    console.log("Action tapped: ", action);
                                    this.actionButtonPressed(action.id);
                                },
                                defaultBackground: ninePatchBackground({
                                    asset: "stoneSlateBackground",
                                    scale: 2,
                                }),
                            }),
                        },
                        {
                            child: uiText({
                                width: wrapUiSize,
                                height: wrapUiSize,
                                text: action.name,
                                style: subTitleTextStyle,
                            }),
                        },
                    ],
                }),
            };
        };

        const buttons: RowChild[] = [];
        for (const action of actions) {
            buttons.push(actionbarButton(action));
            buttons.push({ child: uiBox({ width: 8, height: 1 }) });
        }
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: allSides(16),
            alignment: uiAlignment.bottomLeft,
            children: [
                uiRow({
                    width: wrapUiSize,
                    height: wrapUiSize,
                    children: buttons,
                }),
            ],
        });
    }

    private actionButtonPressed(actionId: string) {
        if (actionId == "build") {
            this.context.stateChanger.push(new BuildMenuState(), (value) => {
                console.log("Pop callback from build");
                if (value == true) {
                    this.onBuildSelected();
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
        }
    }

    private onBuildSelected() {
        console.log("Build was selected");
        this.context.world.buildings.add(
            woodHouseScaffold(this.selectedItem.tilePosition)
        );
        this.context.world.invalidateWorld();
        if (this.selectedItem instanceof TileSelectedItem) {
            this.context.world.jobQueue.schedule(
                new BuildJob(this.selectedItem.tile)
            );
        }
    }
}
