import { withinRectangle } from "../../../common/bounds";
import { Point } from "../../../common/point";
import { allSides } from "../../../common/sides";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../entity/ground";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";

export class BuildMenuState extends InteractionState {
    get isModal(): boolean {
        return true;
    }

    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        const width = window.innerHeight / 3;
        const height = window.innerHeight / 2;
        const x = window.innerWidth / 2 - width / 2;
        const y = window.innerHeight / 2 - height / 2;
        if (withinRectangle(screenPosition, x, y, x + width, y + width)) {
            console.log("Clicked inside, popping with value");
            stateChanger.pop(true);
            return true;
        } else {
            return false;
        }
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
