import { withinRectangle } from "../../../../common/bounds";
import { Point } from "../../../../common/point";
import { allSides } from "../../../../common/sides";
import { InputEvent } from "../../../../input/input";
import { RenderContext } from "../../../../rendering/renderContext";
import { UIView } from "../../../../ui/uiView";
import { GroundTile } from "../../../entity/ground";
import { InteractionState } from "../../handler/interactionState";
import { InteractionStateChanger } from "../../handler/interactionStateChanger";
import { buildMenuStateView } from "./buildMenuStateView";

export class BuildMenuState extends InteractionState {
    private view: UIView;

    get isModal(): boolean {
        return true;
    }

    constructor() {
        super();
        this.view = buildMenuStateView();
    }

    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        /* const width = window.innerHeight / 3;
        const height = window.innerHeight / 2;
        const x = window.innerWidth / 2 - width / 2;
        const y = window.innerHeight / 2 - height / 2;
        if (withinRectangle(screenPosition, x, y, x + width, y + width)) {
            console.log("Clicked inside, popping with value");
            stateChanger.pop(true);
            return true;
        } else {
            return false;
        } */

        return false;
    }

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    onDraw(context: RenderContext): void {
        const start = performance.now();
        if (this.view.isDirty) {
            this.view.layout(context, {
                width: context.width,
                height: context.height,
            });
        }
        this.view.updateTransform();
        this.view.draw(context);
        const end = performance.now();
        console.log(`build state draw: ${end - start}`);
    }
}
