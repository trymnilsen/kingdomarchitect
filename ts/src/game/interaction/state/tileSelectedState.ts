import { Point } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../entity/ground";
import { InteractionState } from "../interactionState";
import { InteractionStateChanger } from "../interactionStateChanger";

export class TileSelectedState implements InteractionState {
    private selectedTile: GroundTile;
    constructor(tile: GroundTile) {
        this.selectedTile = tile;
    }
    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        return false;
    }
    onTileTap(tile: GroundTile, stateChanger: InteractionStateChanger): void {
        // If a new tile was tapped while in this state we move the cursor to it
        console.log("TileSelectedState - onTileTap: ", tile);
        this.selectedTile = tile;
    }
    onInput(input: InputEvent, stateChanger: InteractionStateChanger): boolean {
        return false;
    }
    onActive(): void {}
    onInactive(): void {}
    onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selectedTile.tileX,
            y: this.selectedTile.tileY,
        });
        context.drawImage({
            image: "cursor",
            x: cursorWorldPosition.x,
            y: cursorWorldPosition.y,
        });
    }
}
