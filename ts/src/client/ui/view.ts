export abstract class View {
    public abstract render(): HTMLElement;
    public abstract dispose(): void;
}