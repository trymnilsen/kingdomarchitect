export class ToggleBuildMode {
    get description() {
        return toggleBuildModeDescription;
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
export const toggleBuildModeDescription = {
    name: "Toggle"
};
