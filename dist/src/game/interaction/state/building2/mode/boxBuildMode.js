export class BoxBuildMode {
    get description() {
        return boxBuildModeDescription;
    }
    cursorSelection() {
        throw new Error("Method not implemented.");
    }
    setSelection(point) {
        throw new Error("Method not implemented.");
    }
    getSelection() {
        throw new Error("Method not implemented.");
    }
}
export const boxBuildModeDescription = {
    name: "Box"
};
