import { Direction } from "../../common/direction";
import { Point } from "../../common/point";

export type UIEvent = UITapEvent | UIInputEvent;

export const tapStartType = "tapStart";
export const tapType = "tap";
export const tapUpType = "tapUp";
export const directionInputType = "direction";

export type UITapEvent = UITapStartEvent | UITapEndEvent;
export type UITapStartEvent = {
    type: typeof tapStartType;
    position: Point;
};

export type UITapEndEvent = {
    type: typeof tapType | typeof tapUpType;
    startPosition: Point;
    position: Point;
};

export type UIInputEvent = {
    type: typeof directionInputType;
    direction: Direction;
};

export function isTapEvent(uiEvent: UIEvent): uiEvent is UITapEvent {
    return (
        uiEvent.type == tapStartType ||
        uiEvent.type == tapType ||
        uiEvent.type == tapUpType
    );
}
