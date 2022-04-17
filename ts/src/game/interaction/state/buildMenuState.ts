import { Point } from "../../../common/point";
import { allSides } from "../../../common/sides";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../entity/ground";
import { InteractionState } from "../interactionState";
import { InteractionStateChanger } from "../interactionStateChanger";

export class BuildMenuState extends InteractionState {
    get isModal(): boolean {
        return true;
    }

    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        return false;
    }

    onTileTap(tile: GroundTile, stateChanger: InteractionStateChanger): void {}

    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }

    onDraw(context: RenderContext): void {
        const width = context.height / 3;
        const height = context.height / 2;
        context.drawNinePatchImage({
            asset: "stoneSlateBackground",
            height: height,
            width: width,
            x: context.width / 2 - width / 2,
            y: context.height / 2 - height / 2,
            sides: allSides(16),
        });
    }
}
