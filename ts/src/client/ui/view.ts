import "./view.css";

export abstract class View {
    public abstract render(): HTMLElement;
    public abstract dispose(): void;
    public onMounted(): void {}
}
