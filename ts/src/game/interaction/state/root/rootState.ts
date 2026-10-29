import type { ComponentDescriptor } from "../../../../ui/declarative/ui.ts";
import { type FocusDomain, worldFirstFocus } from "../../focus/focusDomain.ts";
import { InteractionState } from "../../handler/interactionState.ts";
import { uiScaffold } from "../../view/uiScaffold.ts";
import { AlertMessageState } from "../common/alertMessageState.ts";
import { MenuState } from "../menu/menuState.ts";

export class RootState extends InteractionState {
    // With nothing selected the keys select next to where the player last
    // pressed
    override get focusDomains(): readonly FocusDomain[] {
        return worldFirstFocus;
    }

    override getView(): ComponentDescriptor | null {
        return uiScaffold({
            leftButtons: [
                {
                    text: "Quest",
                    onClick: () => {
                        this.context.stateChanger.push(
                            new AlertMessageState(
                                "Quest",
                                "Not implemented yet",
                            ),
                        );
                    },
                },
                {
                    text: "Map",
                    children: [
                        {
                            text: "Hearthlight",
                            onClick: () => {
                                this.context.worldOverlays.toggle(
                                    "hearthlight",
                                );
                            },
                        },
                    ],
                },
            ],
            rightButtons: [
                {
                    text: "Menu",
                    onClick: () => {
                        this.context.stateChanger.push(new MenuState());
                    },
                },
            ],
        });
    }
}
