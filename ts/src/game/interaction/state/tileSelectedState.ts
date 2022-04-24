import { sprites } from "../../../asset/sprite";
import { withinRectangle } from "../../../common/bounds";
import { Point } from "../../../common/point";
import { InputEvent } from "../../../input/input";
import { RenderContext } from "../../../rendering/renderContext";
import { woodHouseEntity } from "../../entity/building/woodenHouseEntity";
import { GroundTile } from "../../entity/ground";
import { InteractionState } from "../handler/interactionState";
import { InteractionStateChanger } from "../handler/interactionStateChanger";
import { BuildMenuState } from "./buildMenuState";
import { MoveState } from "./moveState";

export interface ActionButton {
    name: string;
    id: string;
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
                id: "build",
            },
            {
                name: "Info",
                id: "info",
            },
            {
                name: "Cancel",
                id: "cancel",
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
                if (i == 0) {
                    stateChanger.push(new BuildMenuState(), (value) => {
                        console.log("Pop callback from build");
                        if (value === true) {
                            this.onBuildSelected();
                        }
                    });
                } else if (i == 1) {
                    stateChanger.push(
                        new MoveState({
                            x: this.selectedTile.tileX,
                            y: this.selectedTile.tileY,
                        })
                    );
                }

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

    onDraw(context: RenderContext): void {
        const cursorWorldPosition = context.camera.tileSpaceToWorldSpace({
            x: this.selectedTile.tileX,
            y: this.selectedTile.tileY,
        });

        context.drawSprite({
            sprite: sprites.cursor,
            x: cursorWorldPosition.x + 2,
            y: cursorWorldPosition.y + 2,
        });

        for (let i = 0; i < this.actions.length; i++) {
            const action = this.actions[i];
            const buttonPosition = this.actionBarButtonPosition(
                window.innerWidth,
                window.innerHeight,
                i
            );

            context.drawScreenSpaceImage(
                {
                    x: buttonPosition.x,
                    y: buttonPosition.y,
                    image: "stoneSlateButton",
                },
                1
            );
        }
    }

    private onBuildSelected() {
        console.log("Build was selected");
        this.context.world.buildings.add(
            woodHouseEntity({
                x: this.selectedTile.tileX,
                y: this.selectedTile.tileY,
            })
        );
        this.context.world.invalidateWorld();
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
