import { Point } from "../../common/point";

export type UIEvent = {
    type: "tap" | "tapStart" | "tapEnd";
    position: Point;
};

const foo: UIEvent = {
    type: "tapEnd",
    position: { x: 0, y: 0 },
};
