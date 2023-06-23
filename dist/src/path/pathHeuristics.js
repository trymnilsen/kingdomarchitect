export function manhattanDistance(from, to) {
    const d1 = Math.abs(to.x - from.x);
    const d2 = Math.abs(to.y - from.y);
    return d1 + d2;
}
