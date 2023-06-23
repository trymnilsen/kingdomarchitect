function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
export class SelectedTileItem {
    get tilePosition() {
        return {
            x: this.groundTile.tileX,
            y: this.groundTile.tileY
        };
    }
    get selectionSize() {
        return {
            x: 1,
            y: 1
        };
    }
    isSelectedItem(item) {
        const xIsSame = this.groundTile.tileX === item.tileX;
        const yIsSame = this.groundTile.tileY === item.tileY;
        const treeIsSame = this.groundTile.hasTree === item.hasTree;
        return xIsSame && yIsSame && treeIsSame;
    }
    constructor(groundTile){
        _define_property(this, "groundTile", void 0);
        this.groundTile = groundTile;
    }
}
