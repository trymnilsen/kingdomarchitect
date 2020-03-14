"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderNode_1 = require("./items/renderNode");
const color_1 = require("../../util/color");
const camera_1 = require("./camera");
class Renderer {
    constructor(canvasElementId) {
        this._camera = new camera_1.Camera();
        const canvasElement = document.querySelector(`#${canvasElementId}`);
        if (!canvasElement) {
            throw new Error(`Canvas element ${canvasElementId} not found`);
        }
        window.addEventListener("resize", () => {
            this.onResize();
        });
        this.canvasContext = canvasElement.getContext("2d");
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this._rootNode = new renderNode_1.RenderNode();
    }
    render() {
        const startTime = performance.now();
        const cameraScreenSpace = this._camera.screenPosition;
        this._rootNode.updateTransform(null, cameraScreenSpace);
        //Traverse nodes add to list, breadth first
        const renderList = this.prepareRenderList();
        //Clear screen
        this.clearScreen();
        //run render method on each entry
        this.renderItems(renderList);
        const endTime = performance.now();
        console.log("Render time: " + (endTime - startTime));
    }
    renderItems(renderList) {
        for (let index = 0; index < renderList.length; index++) {
            const element = renderList[index];
            element.render(this.canvasContext);
        }
    }
    clearScreen() {
        this.canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.canvasContext.fillStyle = color_1.rgbToHex(0, 50, 20);
        this.canvasContext.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    get camera() {
        return this._camera;
    }
    get context() {
        return this.renderingContext;
    }
    get rootNode() {
        return this._rootNode;
    }
    onResize() {
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.render();
    }
    prepareRenderList() {
        const renderList = [];
        const queue = [this._rootNode];
        while (queue.length > 0) {
            const node = queue.shift();
            renderList.push(node);
            if (!node.children || node.children.length < 1) {
                continue;
            }
            for (let i = 0; i < node.children.length; i++) {
                queue.push(node.children[i]);
            }
        }
        //Sort list based on depth, keep items with same depth in same order
        const sortArray = renderList.map(function (item, idx) {
            return { idx, item };
        });
        sortArray.sort(function (a, b) {
            if (a.item.depth < b.item.depth)
                return -1;
            if (a.item.depth > b.item.depth)
                return 1;
            return a.idx - b.idx;
        });
        return sortArray.map((element) => element.item);
    }
}
exports.Renderer = Renderer;
//# sourceMappingURL=renderer.js.map