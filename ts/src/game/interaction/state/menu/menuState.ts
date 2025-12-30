import { allSides } from "../../../../common/sides.ts";
import { sprites2 } from "../../../../asset/sprite.ts";
import { bookInkColor } from "../../../../ui/color.ts";
import { ninePatchBackground } from "../../../../ui/uiBackground.ts";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { type ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { uiBox } from "../../../../ui/declarative/uiBox.ts";
import { uiButton } from "../../../../ui/declarative/uiButton.ts";
import { uiColumn } from "../../../../ui/declarative/uiSequence.ts";
import { uiText } from "../../../../ui/declarative/uiText.ts";
import { NewGameCommand } from "../../../../server/message/command/newGameCommand.ts";

declare global {
    interface Window {
        debugChunks: boolean;
    }
}

export class MenuState extends InteractionState {
    override get stateName(): string {
        return "Menu";
    }

    override get isModal(): boolean {
        return true;
    }

    override getView(): ComponentDescriptor | null {
        return uiBox({
            width: fillUiSize,
            height: fillUiSize,
            padding: 16,
            child: uiBox({
                width: 300,
                height: 400,
                padding: 16,
                background: ninePatchBackground({
                    scale: 2,
                    sides: allSides(12),
                    sprite: sprites2.stone_slate_background_2x,
                }),
                child: uiColumn({
                    width: fillUiSize,
                    height: wrapUiSize,
                    gap: 16,
                    children: [
                        this.getButtonView("New game", () => {
                            this.context.commandDispatcher(NewGameCommand());
                        }),
                        this.getButtonView("Bindings", () => {}),
                        this.getButtonView("About", () => {}),
                        this.getButtonView("DebugChunks", () => {
                            window.debugChunks = !window.debugChunks;
                            this.context.stateChanger.pop();
                        }),
                    ],
                }),
            }),
        });
    }

    private getButtonView(
        text: string,
        callback: () => void,
    ): ComponentDescriptor {
        return uiButton({
            onTap: callback,
            padding: 16,
            background: ninePatchBackground({
                sprite: sprites2.stone_slate_border,
                sides: allSides(6),
                scale: 4,
            }),
            width: fillUiSize,
            height: wrapUiSize,
            child: uiText({
                content: text,
                textStyle: {
                    color: bookInkColor,
                    font: "Silkscreen",
                    size: 20,
                },
            }),
        });
    }
}
