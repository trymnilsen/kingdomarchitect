import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import type { Entity } from "../../../entity/entity.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import {
    CraftingComponentId,
    type CraftingComponent,
} from "../../../component/craftingComponent.ts";
import {
    CollectableComponentId,
    hasCollectableItems,
} from "../../../component/collectableComponent.ts";
import { craftingView } from "./craftingView.ts";
import { CollectItemJob } from "../../../job/collectItemJob.ts";
import { createCraftingJob } from "../../../job/craftingJob.ts";
import { QueueJobCommand } from "../../../../server/message/command/queueJobCommand.ts";
import {
    getCraftingJobsForBuilding,
    cancelCraftingJob,
} from "../../../job/craftingJobQuery.ts";

export class CraftWithBuildingState extends InteractionState {
    private _selectedRecipeIndex = 0;
    private _craftingComponent: CraftingComponent;
    private _buildingEntity: Entity;

    override get isModal(): boolean {
        return true;
    }

    override get stateName(): string {
        return "Crafting";
    }

    override getView(): ComponentDescriptor | null {
        const collectableComponent = this._buildingEntity.getEcsComponent(
            CollectableComponentId,
        );

        const selectedRecipe =
            this._craftingComponent.recipes[this._selectedRecipeIndex];
        const allJobs = getCraftingJobsForBuilding(this._buildingEntity);
        const queuedCountForRecipe = selectedRecipe
            ? allJobs.filter((j) => j.recipe.id === selectedRecipe.id).length
            : 0;

        return craftingView({
            recipes: this._craftingComponent.recipes,
            selectedRecipeIndex: this._selectedRecipeIndex,
            hasCollectableItems:
                collectableComponent !== null &&
                hasCollectableItems(collectableComponent),
            queuedCountForRecipe,
            onRecipeSelected: (index: number) => {
                this._selectedRecipeIndex = index;
            },
            onCraft: () => {
                this.onCraft();
            },
            onCollect: () => {
                this.onCollect();
            },
            onCancelOneJob: () => {
                this.onCancelOneJob();
            },
        });
    }

    constructor(buildingEntity: Entity) {
        super();
        const craftingComponent =
            buildingEntity.getEcsComponent(CraftingComponentId);
        if (!craftingComponent) {
            throw new Error(
                "CraftWithBuildingState requires a CraftingComponent on provided entity",
            );
        }

        this._buildingEntity = buildingEntity;
        this._craftingComponent = craftingComponent;
    }

    override onActive(): void {
        // No imperative UI setup needed
    }

    private onCraft() {
        const selectedRecipe =
            this._craftingComponent.recipes[this._selectedRecipeIndex];
        if (!selectedRecipe) {
            return;
        }

        const job = createCraftingJob(this._buildingEntity.id, selectedRecipe);
        this.context.commandDispatcher(QueueJobCommand(job));
    }

    private onCancelOneJob() {
        const selectedRecipe =
            this._craftingComponent.recipes[this._selectedRecipeIndex];
        if (!selectedRecipe) {
            return;
        }
        cancelCraftingJob(
            this.context.root,
            this._buildingEntity.id,
            selectedRecipe.id,
        );
    }

    private onCollect() {
        // Queue a job for a worker to collect items from this building
        const job = CollectItemJob(this._buildingEntity);
        this.context.commandDispatcher(QueueJobCommand(job));
        this.context.stateChanger.pop();
    }
}
