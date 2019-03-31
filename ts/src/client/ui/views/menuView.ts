import { View } from "../view";
import "./menuView.css";

export class MenuView extends View {
    public render(): HTMLElement {
        const buttonContainer = document.createElement("div");
        buttonContainer.id = "button-container";
        const worldsButton = document.createElement("a");
        worldsButton.className = "button";
        worldsButton.href = "/select-world";

        buttonContainer.append(worldsButton);
        worldsButton.innerText = "My Worlds";
        return buttonContainer;
    }

    public dispose(): void {

    }
}
