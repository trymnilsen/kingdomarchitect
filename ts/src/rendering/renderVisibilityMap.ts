import { Point } from "../common/point.js";

export class RenderVisibilityMap {
    private visibilityMap = new Map<string, boolean>();
    isVisible(point: Point) {
        const pointId = this.pointId(point);
        return this.visibilityMap.has(pointId);
    }

    setIsVisible(point: Point, isVisible: boolean) {
        const pointId = this.pointId(point);
        if (isVisible) {
            this.visibilityMap.set(pointId, true);
        } else {
            this.visibilityMap.delete(pointId);
        }
    }

    clear() {
        this.visibilityMap.clear();
    }

    private pointId(point: Point): string {
        return `${point.x}_${point.y}`;
    }
}
