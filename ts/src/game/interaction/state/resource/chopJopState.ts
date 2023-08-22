import { sprites2 } from "../../../../asset/sprite.js";
import { RenderContext } from "../../../../rendering/renderContext.js";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl.js";
import { fillUiSize } from "../../../../ui/uiSize.js";
import { JobQueueComponent } from "../../../component/job/jobQueueComponent.js";
import { ChopTreeJob } from "../../../component/job/jobs/chopTreeJob.js";
import { TreeComponent } from "../../../component/resource/treeComponent.js";
import { Entity } from "../../../entity/entity.js";
import { InteractionState } from "../../handler/interactionState.js";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold.js";

export class ChopJobState extends InteractionState {
    constructor(private selection: Entity) {
        super();
    }

    override onActive(): void {
        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            [
                {
                    text: "Confirm",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.scheduleChop();
                    },
                },
                {
                    text: "Cancel",
                    icon: sprites2.empty_sprite,
                    onClick: () => {
                        this.context.stateChanger.pop(null);
                    },
                },
            ],
            [],
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldView;
    }

    override onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selection.worldPosition.x,
            y: this.selection.worldPosition.y,
        });

        context.drawSprite({
            sprite: sprites2.cursor,
            x: cursorWorldPosition.x + 2,
            y: cursorWorldPosition.y + 2,
        });

        super.onDraw(context);
    }

    private scheduleChop() {
        console.log("Schedule chop tree job");
        const selection = this.selection.requireComponent(TreeComponent);
        this.context.root
            .requireComponent(JobQueueComponent)
            .addJob(ChopTreeJob.createInstance(selection));

        console.log("Clear state changer job");
        this.context.stateChanger.clear();
    }
}
