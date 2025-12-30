import { makeNumberId } from "../common/point.ts";

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
        const pointId = makeNumberId(x, y);
        return this.visibilityMap.has(pointId);
    }

    hasDiscovered(worldTileX: number, worldTileY: number) {
        const id = makeNumberId(worldTileX, worldTileY);
    }

    setIsVisible(x: number, y: number, isVisible: boolean) {
        const pointId = makeNumberId(x, y);
        if (isVisible) {
            this.visibilityMap.set(pointId, true);
        } else {
            this.visibilityMap.delete(pointId);
        }
    }

    clear() {
        this.visibilityMap.clear();
    }
}
