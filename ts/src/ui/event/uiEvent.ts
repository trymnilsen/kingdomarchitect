import { Point } from "../../common/point.ts";

export type UIEvent = UITapEvent;

export const tapStartType = "tapStart";
export const tapType = "tap";
export const tapUpType = "tapUp";

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
