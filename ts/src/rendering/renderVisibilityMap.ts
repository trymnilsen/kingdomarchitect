import { Point } from "../common/point.js";

export class RenderVisibilityMap {
    private _useVisibility = false;

    public get useVisibility(): boolean {
        return this._useVisibility;
    }

    public set useVisibility(v: boolean) {
        this._useVisibility = v;
    }

    private visibilityMap = new Map<number, boolean>();
    isVisible(x: number, y: number) {
        const pointId = this.makeNumberId(x, y);
        return this.visibilityMap.has(pointId);
    }

    setIsVisible(x: number, y: number, isVisible: boolean) {
        const pointId = this.makeNumberId(x, y);
        if (isVisible) {
            this.visibilityMap.set(pointId, true);
        } else {
            this.visibilityMap.delete(pointId);
        }
    }

    clear() {
        this.visibilityMap.clear();
    }

    private makeNumberId(x: number, y: number): number {
        return ((x & 0xffff) << 16) | (y & 0xffff);
    }
}
