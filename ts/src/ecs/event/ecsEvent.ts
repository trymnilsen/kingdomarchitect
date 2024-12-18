import { ConstructorFunction } from "../../common/constructor.js";
import { Point } from "../../common/point.js";
import { InputAction } from "../../input/inputAction.js";
import { DrawMode } from "../../rendering/drawMode.js";
import { RenderScope } from "../../rendering/renderScope.js";
import { TransformComponent } from "../transformComponent.js";

export abstract class EcsEvent {
    private _handled: boolean = false;

    public get handled(): boolean {
        return this._handled;
    }

    public markHandled(): void {
        this._handled = true;
    }
}

export type EcsEventFn = ConstructorFunction<EcsEvent>;
