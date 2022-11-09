import { sprites } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { getActionbarView } from "../../view/actionbar";
import { PathBuildState } from "./pathBuildState";
import { SelectedBuild } from "./selectedBuild";

export class PathOrSingleBuildState extends InteractionState {
    private showBuilding: boolean = true;

    constructor(
        private selectionPosition: Point,
        private selectedBuild: SelectedBuild
    ) {
        super();
        this.view = getActionbarView(
            [
                {
                    name: "Single",
                    id: "single",
                },
                {
                    name: "Path",
                    id: "path",
                },
            ],
            (action) => {
                this.onActionButton(action.id);
            }
        );
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    override onUpdate(tick: number) {
        this.showBuilding = tick % 2 == 1;
    }

    override onDraw(context: RenderContext) {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace(
            this.selectionPosition
        );
        if (this.showBuilding) {
            context.drawSprite({
                sprite: this.selectedBuild.sprite,
                x: cursorWorldPosition.x + 3,
                y: cursorWorldPosition.y + 3,
            });
        }

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 3,
            y: cursorWorldPosition.y + 3,
        });

        super.onDraw(context);
    }

    private onActionButton(action: string) {
        if (action == "path") {
            this.context.stateChanger.push(new PathBuildState());
        }
    }
}
