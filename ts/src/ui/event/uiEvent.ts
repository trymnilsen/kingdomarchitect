import { Point } from "../../common/point";

export type UIEvent = {
    type: "tap" | "tapStart" | "tapEnd";
    position: Point;
};
