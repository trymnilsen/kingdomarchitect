import { sprites } from "../../../../asset/sprite";
import { Point } from "../../../../common/point";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { getActionbarView } from "../../view/actionbar";
import { SelectedBuild } from "./selectedBuild";

export class PathOrSingleBuild extends InteractionState {
    constructor(
        private selectionPosition: Point,
        private selectedBuild: SelectedBuild
    ) {
        super();
        this.view = getActionbarView(
            [
                {
                    name: !this.selectedBuild ? "Single" : "foo",
                    id: "single",
                },
                {
                    name: "Path",
                    id: "path",
                },
            ],
            (action) => {}
        );
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    override onDraw(context: RenderContext) {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace(
            this.selectionPosition
        );

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 3,
            y: cursorWorldPosition.y + 3,
        });

        super.onDraw(context);
    }
}
