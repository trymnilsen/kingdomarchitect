import { withinRectangle } from "../../../common/bounds";
import { Point } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { InputAction } from "../../../input/inputAction";
import { RenderContext } from "../../../rendering/renderContext";
import { GroundTile } from "../../entity/ground";
import { InteractionState } from "../interactionState";
import { InteractionStateChanger } from "../interactionStateChanger";
import { BuildMenuState } from "./buildMenuState";

export interface ActionButton {
    name: string;
}

export class TileSelectedState extends InteractionState {
    private selectedTile: GroundTile;
    private actions: ActionButton[] = [];

    constructor(tile: GroundTile) {
        super();

        this.selectedTile = tile;
        this.actions = [
            {
                name: "Build",
            },
            {
                name: "Info",
            },
            {
                name: "Cancel",
            },
        ];
    }
    onTap(
        screenPosition: Point,
        stateChanger: InteractionStateChanger
    ): boolean {
        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            const position = this.actionBarButtonPosition(
                window.innerWidth,
                window.innerHeight,
                i
            );

            if (
                withinRectangle(
                    screenPosition,
                    position.x,
                    position.y,
                    position.x + 48,
                    position.y + 48
                )
            ) {
                console.log("TileSelectedState - onTap: ", i);
                stateChanger.push(new BuildMenuState());
                return true;
            }
        }

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

        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            const buttonPosition = this.actionBarButtonPosition(
                window.innerWidth,
                window.innerHeight,
                i
            );

            context.drawScreenSpaceImage({
                x: buttonPosition.x,
                y: buttonPosition.y,
                image: "stoneSlateBackground",
            });
        }
    }

    private actionBarButtonPosition(
        clientWidth: number,
        clientHeight: number,
        buttonIndex: number
    ): Point {
        return {
            x: 64 + buttonIndex * (48 + 8),
            y: clientHeight - 64 - 48,
        };
    }
}
