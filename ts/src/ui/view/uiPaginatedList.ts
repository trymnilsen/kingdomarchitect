import { UISize } from "../uiSize.js";
import { UIView } from "../uiView.js";

export class UIPaginatedList extends UIView {
    hitTest(): boolean {
        throw new Error("Method not implemented.");
    }
    layout(): UISize {
        throw new Error("Method not implemented.");
    }
    draw(): void {
        throw new Error("Method not implemented.");
    }
}
