"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameView_1 = require("./ui/gameView");
async function bootstrap() {
    console.log("Bootstrapping");
    const view = new gameView_1.GameView();
    view.init();
}
exports.bootstrap = bootstrap;
document.addEventListener("DOMContentLoaded", () => {
    bootstrap();
}, false);
//# sourceMappingURL=main.js.map