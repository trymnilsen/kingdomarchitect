export interface Point {
    x: number;
    y: number;
}

export function addPoint(p1: Point, p2: Point) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}

export function changeX(point: Point, amount: number) {
    return {
        x: point.x + amount,
        y: point.y
    };
}
export function changeY(point: Point, amount: number) {
    return {
        x: point.x,
        y: point.y + amount
    };
}
