function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { sprites2 } from "../../../../asset/sprite.js";
import { allSides } from "../../../../common/sides.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { WorkerBehaviorComponent } from "../../../world/component/behavior/workerBehaviorComponent.js";
import { JobQueueComponent } from "../../../world/component/job/jobQueueComponent.js";
import { SelectedItemIsTargetQuery } from "../../../world/component/job/query/selectedItemIsTargetQuery.js";
import { ChestComponent } from "../../../world/component/resource/chestComponent.js";
import { TreeComponent } from "../../../world/component/resource/treeComponent.js";
import { SelectedEntityItem } from "../../../world/selection/selectedEntityItem.js";
import { SelectedTileItem } from "../../../world/selection/selectedTileItem.js";
import { TileSize } from "../../../world/tile/tile.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";
import { CharacterSkillState } from "../character/characterSkillState.js";
import { ChopJobState } from "../resource/chopJopState.js";
import { CollectChestState } from "../resource/collectChestState.js";
export class SelectionState extends InteractionState {
    onActive() {
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
    } */ onTileTap(tile) {
        // If a new tile was tapped while in this state we move the cursor to it
        console.log("TileSelectedState - onTileTap: ", tile);
        const entitiesAt = this.context.world.rootEntity.getEntityAt({
            x: tile.tileX,
            y: tile.tileY
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
    onDraw(context) {
        const cursorWorldPosition = context.camera.tileSpaceToScreenSpace(this.selectedItem.tilePosition);
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
            y: cursorWorldPosition.y
        });
        super.onDraw(context);
    }
    updateTileActions() {
        const actions = this.getTileActions(this.selectedItem);
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize
        });
        const scaffoldView = new UIActionbarScaffold(contentView, actions, [], {
            width: fillUiSize,
            height: fillUiSize
        });
        this.view = scaffoldView;
    }
    getTileActions(selection) {
        if (selection instanceof SelectedEntityItem) {
            let actions = [];
            const tree = selection.entity.getComponent(TreeComponent);
            if (!!tree) {
                const jobQueue = selection.entity.getAncestorComponent(JobQueueComponent);
                if (!jobQueue) {
                    throw new Error("No job queue component on root for selection");
                }
                const currentJob = jobQueue.query(new SelectedItemIsTargetQuery(selection));
                if (currentJob) {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Abort",
                        onClick: ()=>{
                            this.abortJob(currentJob);
                        }
                    });
                } else {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Chop",
                        onClick: ()=>{
                            this.onChopSelected();
                        }
                    });
                }
                actions.push({
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: ()=>{
                        this.onCancel();
                    }
                });
            }
            const worker = selection.entity.getComponent(WorkerBehaviorComponent);
            if (!!worker) {
                actions = [
                    {
                        icon: sprites2.empty_sprite,
                        text: "Skills",
                        onClick: ()=>{
                            this.onSkills();
                        }
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: ()=>{
                            this.onCancel();
                        }
                    }
                ];
            }
            const chest = selection.entity.getComponent(ChestComponent);
            if (!!chest) {
                actions = [
                    {
                        text: "Collect",
                        icon: sprites2.empty_sprite,
                        onClick: ()=>{
                            this.onCollect();
                        }
                    },
                    {
                        icon: sprites2.empty_sprite,
                        text: "Cancel",
                        onClick: ()=>{
                            this.onCancel();
                        }
                    }
                ];
            }
            return actions;
        } else if (selection instanceof SelectedTileItem) {
            const tile = this.context.world.ground.getTile(selection.tilePosition);
            const actions = [];
            if (tile && tile.hasTree) {
                const jobQueue = this.context.world.rootEntity.getComponent(JobQueueComponent);
                if (!jobQueue) {
                    throw new Error("No job queue component on root for selection");
                }
                const currentJob = jobQueue.query(new SelectedItemIsTargetQuery(selection));
                if (currentJob) {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Abort",
                        onClick: ()=>{
                            this.abortJob(currentJob);
                        }
                    });
                } else {
                    actions.push({
                        icon: sprites2.empty_sprite,
                        text: "Chop",
                        onClick: ()=>{
                            this.onChopSelected();
                        }
                    });
                }
                actions.push({
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: ()=>{
                        this.onCancel();
                    }
                });
            }
            return actions;
        } else {
            return [
                {
                    icon: sprites2.empty_sprite,
                    text: "Cancel",
                    onClick: ()=>{
                        this.onCancel();
                    }
                }
            ];
        }
    }
    abortJob(job) {
        job.abort();
        this.context.stateChanger.pop(null);
    }
    onChopSelected() {
        const selectedTile = this.selectedItem;
        this.context.stateChanger.push(new ChopJobState(selectedTile));
    }
    onCancel() {
        this.context.stateChanger.pop(null);
    }
    onSkills() {
        this.context.stateChanger.push(new CharacterSkillState());
    }
    onCollect() {
        if (this.selectedItem instanceof SelectedEntityItem) {
            const chest = this.selectedItem.entity.getComponent(ChestComponent);
            if (!chest) {
                throw new Error("No chest component found");
            }
            this.context.stateChanger.push(new CollectChestState(chest));
        }
    }
    constructor(selection){
        super();
        _define_property(this, "selectedItem", void 0);
        this.selectedItem = selection;
    }
}
