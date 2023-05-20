import { sprites2 } from "../../../../asset/sprite";
import { RenderContext } from "../../../../rendering/renderContext";
import { uiBox } from "../../../../ui/dsl/uiBoxDsl";
import { SpriteBackground } from "../../../../ui/uiBackground";
import { fillUiSize } from "../../../../ui/uiSize";
import { ChopTreeJob } from "../../../world/job/jobs/chopTreeJob";
import { SelectedWorldItem } from "../../../world/selection/selectedWorldItem";
import { InteractionState } from "../../handler/interactionState";
import {
    UIActionbar,
    UIActionbarAlignment,
} from "../../view/actionbar/uiActionbar";
import { UIActionbarScaffold } from "../../view/actionbar/uiActionbarScaffold";

export class ChopJobState extends InteractionState {
    constructor(private selection: SelectedWorldItem) {
        super();
    }

    override onActive(): void {
        const leftActionbar = new UIActionbar(
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
            new SpriteBackground(sprites2.stone_slate_background_2x),
            UIActionbarAlignment.Left,
            {
                width: fillUiSize,
                height: fillUiSize,
            }
        );

        const contentView = uiBox({
            width: fillUiSize,
            height: fillUiSize,
        });

        const scaffoldView = new UIActionbarScaffold(
            contentView,
            leftActionbar,
            null,
            { width: fillUiSize, height: fillUiSize }
        );

        this.view = scaffoldView;
    }

    override onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selection.tilePosition.x,
            y: this.selection.tilePosition.y,
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
        this.context.world.jobQueue.schedule(new ChopTreeJob(this.selection));

        console.log("Clear state changer job");
        this.context.stateChanger.clear();
    }
}
