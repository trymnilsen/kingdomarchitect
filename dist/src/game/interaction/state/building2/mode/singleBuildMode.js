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
export class SingleBuildMode {
    get description() {
        return singleBuildModeDescription;
    }
    cursorSelection() {
        return this.currentSelection;
    }
    setSelection(point) {
        this.currentSelection = point;
    }
    getSelection() {
        return [
            this.currentSelection
        ];
    }
    constructor(selection){
        _define_property(this, "currentSelection", void 0);
        this.currentSelection = selection;
    }
}
export const singleBuildModeDescription = {
    name: "Single"
};
