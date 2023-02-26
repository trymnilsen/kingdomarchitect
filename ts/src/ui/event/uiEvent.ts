import { Direction } from "../../common/direction";
import { Point } from "../../common/point";

export type UIEvent = UITapEvent | UIInputEvent;

export const tapType = "tap";
export const tapStartType = "tapStart";
export const tapEndType = "tapEnd";
export const directionInputType = "direction";

export type UITapEventType =
    | typeof tapType
    | typeof tapStartType
    | typeof tapEndType;

export type UITapEvent = {
    type: UITapEventType;
    position: Point;
};

export type UIInputEvent = {
    type: typeof directionInputType;
    direction: Direction;
};

export function isTapEvent(uiEvent: UIEvent): uiEvent is UITapEvent {
    return (
        uiEvent.type == tapType ||
        uiEvent.type == tapStartType ||
        uiEvent.type == tapEndType
    );
}
