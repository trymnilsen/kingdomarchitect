export function allSides(size) {
    return {
        top: size,
        left: size,
        right: size,
        bottom: size
    };
}
export function symmetricSides(horizontal, vertical) {
    return {
        left: horizontal,
        right: horizontal,
        top: vertical,
        bottom: vertical
    };
}
export function zeroSides() {
    return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
}
export function totalHorizontal(sides) {
    return sides.left + sides.right;
}
export function totalVertical(sides) {
    return sides.top + sides.bottom;
}
