import { Point } from "../common/point";
import { InputAction } from "../input/inputAction";
import { RenderContext } from "../rendering/renderContext";

export interface Scene {
    drawScene(context: RenderContext): void;
    input(action: InputAction): void;
    tap(screenPoint: Point): void;
    tick(tick: number): void;
}
