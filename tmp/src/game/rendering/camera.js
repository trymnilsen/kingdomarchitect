"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const point_1 = require("../../data/point");
const chunk_1 = require("../gameScene/world/chunk");
const TilesPadding = 4;
const BufferSize = chunk_1.TileSize * TilesPadding;
class Camera {
    constructor() {
        this.cameraPosition = { x: 0, y: 0 };
    }
    center(worldSpace) {
        const screenSpace = {
            x: worldSpace.x * -chunk_1.TileSize,
            y: worldSpace.y * -chunk_1.TileSize
        };
        this.cameraPosition = screenSpace;
    }
    follow(worldSpace) {
        const translation = { x: 0, y: 0 };
        const screenSpace = {
            x: worldSpace.x * chunk_1.TileSize +
                window.innerWidth / 2 +
                this.cameraPosition.x,
            y: worldSpace.y * chunk_1.TileSize +
                window.innerHeight / 2 +
                this.cameraPosition.y
        };
        //Check if outside of the client area which is considered to be the size
        //of four tiles. This means that if the point moves outside
        //this area/rectangle (in screenspace) we will move the camera
        //enough to keep the point inside the client rectangle¨
        if (screenSpace.x < BufferSize) {
            const amountOutside = BufferSize - screenSpace.x;
            translation.x = amountOutside;
        }
        else if (screenSpace.x > window.innerWidth - BufferSize) {
            const amountOutside = window.innerWidth - BufferSize - screenSpace.x;
            translation.x = amountOutside;
        }
        if (screenSpace.y < BufferSize) {
            const amountOutside = BufferSize - screenSpace.y;
            translation.y = amountOutside;
        }
        else if (screenSpace.y > window.innerHeight - BufferSize) {
            const amountOutside = window.innerHeight - BufferSize - screenSpace.y;
            translation.y = amountOutside;
        }
        this.cameraPosition = point_1.addPoint(this.cameraPosition, translation);
    }
    get screenPosition() {
        return {
            x: this.cameraPosition.x + window.innerWidth / 2,
            y: this.cameraPosition.y + window.innerHeight / 2
        };
    }
}
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map