import { allSides } from "../../../../common/sides.js";
import { sprites2 } from "../../../../asset/sprite.js";
import { bookInkColor } from "../../../../ui/color.js";
import { ninePatchBackground } from "../../../../ui/uiBackground.js";
import { fillUiSize, wrapUiSize } from "../../../../ui/uiSize.js";
import { InteractionState } from "../../handler/interactionState.js";
import { type ComponentDescriptor } from "../../../../ui/declarative/ui.js";
import { uiBox } from "../../../../ui/declarative/uiBox.js";
import { uiButton } from "../../../../ui/declarative/uiButton.js";
import { uiColumn } from "../../../../ui/declarative/uiSequence.js";
import { uiText } from "../../../../ui/declarative/uiText.js";

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
                            window.localStorage.clear();
                            location.reload();
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
