import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { WorkerBehaviorComponent } from "../../../component/behavior/workerBehaviorComponent.js";
import { Job } from "../../../component/job/job.js";
import { JobQueueComponent } from "../../../component/job/jobQueueComponent.js";
import { query } from "../../../component/job/query/jobQuery.js";
import { SelectedItemIsTargetQuery } from "../../../component/job/query/selectedItemIsTargetQuery.js";
import { ChestComponent } from "../../../component/resource/chestComponent.js";
import { TreeComponent } from "../../../component/resource/treeComponent.js";
import { ChunkMapComponent } from "../../../component/root/chunk/chunkMapComponent.js";
import { TilesComponent } from "../../../component/tile/tilesComponent.js";
import { SelectedEntityItem } from "../../../selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../selection/selectedTileItem.js";
import { SelectedWorldItem } from "../../../selection/selectedWorldItem.js";
import { GroundTile } from "../../../map/tile.js";
import { TileSize } from "../../../map/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarItem } from "../../view/actionbar/uiActionbar.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { CharacterSkillState } from "../character/characterSkillState.js";
import { ChopJobState } from "../resource/chopJopState.js";
import { CollectChestState } from "../resource/collectChestState.js";

export class SelectionState extends InteractionState {
    private selectedItem: SelectedWorldItem;

    constructor(selection: SelectedWorldItem) {
        super();
        this.selectedItem = selection;
    }

    override onActive(): void {
        this.updateTileActions();
    }

    override onTileTap(tile: GroundTile): boolean {
        // If a new tile was tapped while in this state we move the cursor to it
        console.log("TileSelectedState - onTileTap: ", tile);
        const entitiesAt = this.context.root
            .requireComponent(ChunkMapComponent)
            .getEntityAt({
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
            this.selectedItem.tilePosition,
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
        const actions = this.getTileActions(this.selectedItem);

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(contentView, actions, [], {
            width: fillUiSize,
            height: fillUiSize,
        });

        this.view = scaffoldView;
    }

    private getTileActions(selection: SelectedWorldItem): UIActionbarItem[] {
        if (selection instanceof SelectedEntityItem) {
            let actions: UIActionbarItem[] = [];
            const tree = selection.entity.getComponent(TreeComponent);
            if (tree) {
                const jobQueue =
                    selection.entity.getAncestorComponent(JobQueueComponent);

                if (!jobQueue) {
                    throw new Error(
                        "No job queue component on root for selection",
                    );
                }

                const currentJob = query(
                    selection.entity.getRootEntity(),
                    new SelectedItemIsTargetQuery(selection),
                );

                if (currentJob) {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Abort",
                        onClick: () => {
                            this.abortJob(currentJob);
                        },
                    });
                } else {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Chop",
                        onClick: () => {
                            this.onChopSelected();
                        },
                    });
                }

                actions.push({
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: () => {
                        this.onCancel();
                    },
                });
            }

            const worker = selection.entity.getComponent(
                WorkerBehaviorComponent,
            );

            if (worker) {
                actions = [
                    {
                        icon: sprites2.empty_sprite,
                        text: "Skills",
                        onClick: () => {
                            this.onSkills();
                        },
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: () => {
                            this.onCancel();
                        },
                    },
                ];
            }

            const chest = selection.entity.getComponent(ChestComponent);

            if (chest) {
                actions = [
                    {
                        text: "Collect",
                        icon: sprites2.empty_sprite,
                        onClick: () => {
                            this.onCollect();
                        },
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: () => {
                            this.onCancel();
                        },
                    },
                ];
            }

            return actions;
        } else if (selection instanceof SelectedTileItem) {
            const tile = this.context.root
                .requireComponent(TilesComponent)
                .getTile(selection.tilePosition);

            const actions: UIActionbarItem[] = [];
            if (tile) {
                const jobQueue =
                    this.context.root.getComponent(JobQueueComponent);

                if (!jobQueue) {
                    throw new Error(
                        "No job queue component on root for selection",
                    );
                }

                const currentJob = query(
                    this.context.root,
                    new SelectedItemIsTargetQuery(selection),
                );

                if (currentJob) {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Abort",
                        onClick: () => {
                            this.abortJob(currentJob);
                        },
                    });
                } else {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Chop",
                        onClick: () => {
                            //TODO: look for tree entity
                            //this.onChopSelected();
                        },
                    });
                }

                actions.push({
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: () => {
                        this.onCancel();
                    },
                });
            }

            return actions;
        } else {
            return [
                {
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: () => {
                        this.onCancel();
                    },
                },
            ];
        }
    }

    private abortJob(job: Job) {
        job.abort();
        this.context.stateChanger.pop(null);
    }

    private onChopSelected() {
        const selectedTile = this.selectedItem;
        if (selectedTile instanceof SelectedEntityItem) {
            this.context.stateChanger.push(
                new ChopJobState(selectedTile.entity),
            );
        }
    }

    private onCancel() {
        this.context.stateChanger.pop(null);
    }

    private onSkills() {
        this.context.stateChanger.push(new CharacterSkillState());
    }

    private onCollect() {
        if (this.selectedItem instanceof SelectedEntityItem) {
            const chest = this.selectedItem.entity.getComponent(ChestComponent);

            if (!chest) {
                throw new Error("No chest component found");
            }

            this.context.stateChanger.push(new CollectChestState(chest));
        }
    }
}
