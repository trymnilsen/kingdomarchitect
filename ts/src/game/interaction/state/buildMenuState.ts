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
        const x = context.width / 2 - width / 2;
        const y = context.height / 2 - height / 2;
        const windowScale = 4;
        context.drawNinePatchImage({
            asset: "stoneSlateBackground",
            height: height,
            width: width,
            x: x,
            y: y,
            sides: allSides(16),
            scale: windowScale,
        });

        context.drawNinePatchImage({
            asset: "fancyWoodBackground",
            height: 80,
            width: width - 64,
            x: x + 32,
            y: y + 64,
            sides: allSides(9),
            scale: windowScale,
        });

        context.drawNinePatchImage({
            asset: "fancyWoodBackground",
            height: 80,
            width: width - 64,
            x: x + 32,
            y: y + 64 + 96,
            sides: allSides(9),
            scale: windowScale,
        });

        context.drawNinePatchImage({
            asset: "fancyWoodBackground",
            height: 80,
            width: width - 64,
            x: x + 32,
            y: y + 64 + 192,
            sides: allSides(9),
            scale: windowScale,
        });
    }
}
