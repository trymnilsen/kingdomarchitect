import "./view.css";
import { ViewContext } from "./viewContext";

export abstract class View {
    public abstract render(): HTMLElement;
    public abstract dispose(): void;
    public onMounted(viewContext: ViewContext): void {}
}
