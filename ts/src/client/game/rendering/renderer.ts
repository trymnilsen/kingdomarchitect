export class Renderer {
    private renderingContext: CanvasRenderingContext2D;

    public constructor(canvasElementId: string) {
        const canvasElement: HTMLCanvasElement = document.querySelector(
            canvasElementId
        );
        if (!canvasElement) {
            throw new Error(`Canvas element $canvasElementId not found`);
        }

        this.renderingContext = canvasElement.getContext("2d");
    }
}
