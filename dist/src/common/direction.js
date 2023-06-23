import { randomEntry } from "./array.js";
export var Direction;
(function(Direction) {
    Direction["Up"] = "up";
    Direction["Down"] = "down";
    Direction["Left"] = "left";
    Direction["Right"] = "right";
})(Direction || (Direction = {}));
export function invertDirection(direction) {
    switch(direction){
        case Direction.Down:
            return Direction.Up;
        case Direction.Up:
            return Direction.Down;
        case Direction.Left:
            return Direction.Right;
        case Direction.Right:
            return Direction.Left;
    }
}
export function invertAxis(axis) {
    switch(axis){
        case Axis.XAxis:
            return Axis.YAxis;
        case Axis.YAxis:
            return Axis.XAxis;
    }
}
export function getAxis(direction) {
    switch(direction){
        case Direction.Down:
        case Direction.Up:
            return Axis.YAxis;
        case Direction.Left:
        case Direction.Right:
            return Axis.XAxis;
    }
}
export function getRandomDirection(axis) {
    let directions = [];
    if (axis === Axis.XAxis) {
        directions = horizontalDirections;
    } else if (axis === Axis.YAxis) {
        directions = verticalDirections;
    } else {
        directions = [
            ...verticalDirections,
            ...horizontalDirections
        ];
    }
    return randomEntry(directions);
}
export function getRandomAxis() {
    const randomAxis = Math.floor(Math.random() * 2);
    if (randomAxis >= 1.0) {
        return Axis.YAxis;
    } else {
        return Axis.XAxis;
    }
}
export var Axis;
(function(Axis) {
    Axis[Axis["XAxis"] = 0] = "XAxis";
    Axis[Axis["YAxis"] = 1] = "YAxis";
})(Axis || (Axis = {}));
const verticalDirections = [
    Direction.Up,
    Direction.Down
];
const horizontalDirections = [
    Direction.Left,
    Direction.Right
];
