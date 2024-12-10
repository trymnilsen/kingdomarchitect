import { ConstructorFunction } from "../common/constructor.js";
import { Point } from "../common/point.js";
import { InputAction } from "../input/inputAction.js";
import { DrawMode } from "../rendering/drawMode.js";
import { RenderScope } from "../rendering/renderScope.js";

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
export class EcsUpdateEvent extends EcsEvent {}
export class EcsInitEvent extends EcsEvent {}
export class EcsRenderEvent extends EcsEvent {
    constructor(
        public renderScope: RenderScope,
        private drawMode: DrawMode,
    ) {
        super();
    }
}
export class EcsInputEvent extends EcsEvent {
    constructor(public data: EcsInputEventData) {
        super();
    }
}
export type EcsInputEventData =
    | EcsInputTapDownData
    | EcsInputTapEndData
    | EcsInputPanData
    | EcsInputActionData;

export type EcsInputTapDownData = {
    id: "tap-down";
    position: Point;
};
export type EcsInputTapEndData = {
    id: "tap-end";
    position: Point;
    startPosition: Point;
    wasDragging: boolean;
};
export type EcsInputPanData = {
    id: "pan";
    movement: Point;
    position: Point;
    startPosition: Point;
    downTapHandled: boolean;
};

export type EcsInputActionData = {
    id: "action";
    action: InputAction;
};
