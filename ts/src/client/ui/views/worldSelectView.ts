import { View } from "../view";

export class WorldSelectView extends View {
    public render(): HTMLElement {
        const listContainer = document.createElement("div");
        const list = document.createElement("ul");
        this.createWorldListItems().forEach((item) => {
            list.appendChild(item);
        });

        listContainer.append(list);

        const createWorldButton = document.createElement("a");
        createWorldButton.innerText = "Create World";

        listContainer.append(createWorldButton);
        return listContainer;
    }    
    public dispose(): void {

    }
    private createWorldListItems(): HTMLElement[] {
        const items: HTMLElement[] = [];
        items.push(this.createSingleWorldListItem("TestWorld1"));
        items.push(this.createSingleWorldListItem("My Super Empire"));
        items.push(this.createSingleWorldListItem("The world i forgot"));
        return items;
    }
    private createSingleWorldListItem(name: string): HTMLElement {
        const listItem = document.createElement("li");
        const worldLink = document.createElement("a");

        worldLink.innerText = name;
        worldLink.href = "/world/0e5e5f21-55ce-4023-9847-5cf14bbc6194";
        listItem.append(worldLink);
        return listItem;
    }
}