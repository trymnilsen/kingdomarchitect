"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function addPoint(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}
exports.addPoint = addPoint;
function subtractPoint(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}
exports.subtractPoint = subtractPoint;
function changeX(point, amount) {
    return {
        x: point.x + amount,
        y: point.y
    };
}
exports.changeX = changeX;
function changeY(point, amount) {
    return {
        x: point.x,
        y: point.y + amount
    };
}
exports.changeY = changeY;
//# sourceMappingURL=point.js.map