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
import { pointEquals } from "../../../../../common/point.js";
export class LineBuildMode {
    get description() {
        return boxBuildModeDescription;
    }
    cursorSelection() {
        return this.selection[this.selection.length - 1];
    }
    setSelection(point) {
        if (pointEquals(this.from, point)) {
            return;
        }
        const xRange = point.x - this.from.x;
        const yRange = point.y - this.from.y;
        const positions = [];
        console.log("SetSelection", this.from, point, xRange, yRange);
        // 1 is subtracted from the range to avoid pushing a duplicate
        // position where the horizontal line (made here) and the
        // vertical lines meet
        for(let x = 0; x < Math.abs(xRange); x++){
            let direction = 1;
            if (xRange < 0) {
                direction = -1;
            }
            const xPosition = this.from.x + x * direction;
            positions.push({
                x: xPosition,
                y: this.from.y
            });
        }
        for(let y = 0; y < Math.abs(yRange); y++){
            let direction = 1;
            if (yRange < 0) {
                direction = -1;
            }
            const yPosition = this.from.y + y * direction;
            positions.push({
                x: point.x,
                y: yPosition
            });
        }
        positions.push(point);
        //Filter out duplicates
        this.selection = positions.filter((value, index, self)=>index === self.findIndex((t)=>t.x === value.x && t.y === value.y));
        this.from = point;
    }
    getSelection() {
        return this.selection;
    }
    constructor(initialPoint){
        _define_property(this, "from", void 0);
        _define_property(this, "selection", []);
        this.from = initialPoint;
        this.selection = [
            initialPoint
        ];
    }
}
export const boxBuildModeDescription = {
    name: "Line"
};
