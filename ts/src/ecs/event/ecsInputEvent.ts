import { Point } from "../../common/point.js";
import { InputAction } from "../../input/inputAction.js";
import { EcsEvent } from "./ecsEvent.js";

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
