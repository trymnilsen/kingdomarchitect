import { RenderNode } from "../rendering/items/renderNode";
import { playerVisual } from "../visual/player";

export class PlayerEntity {
    private playerVisual: RenderNode;

    constructor() {
        this.playerVisual = playerVisual();
    }
    render(): RenderNode {
        return this.playerVisual;
    }
}
