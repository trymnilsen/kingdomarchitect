import { RenderContext } from "./renderContext";
import { RenderNode } from "./items/renderNode";
import { rgbToHex } from "../../../common/color";

export class Renderer {
    private canvasContext: CanvasRenderingContext2D;
    private renderingContext: RenderContext;
    private _rootNode: RenderNode;

    public constructor(canvasElementId: string) {
        const canvasElement: HTMLCanvasElement = document.querySelector(
            `#${canvasElementId}`
        );
        if (!canvasElement) {
            throw new Error(`Canvas element ${canvasElementId} not found`);
        }
        window.addEventListener("resize", () => {
            this.onResize();
        });
        this.canvasContext = canvasElement.getContext("2d");
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this._rootNode = new RenderNode();
    }

    public render() {
        const startTime = performance.now();
        this._rootNode.updateTransform(null);
        //Traverse nodes add to list, breadth first
        const renderList = this.prepareRenderList();
        //Clear screen
        this.clearScreen();
        //run render method on each entry
        this.renderItems(renderList);
        const endTime = performance.now();
        console.log("Render time: " + (endTime - startTime));
    }

    private renderItems(renderList: RenderNode[]) {
        for (let index = 0; index < renderList.length; index++) {
            const element = renderList[index];
            element.render(this.canvasContext);
        }
    }

    private clearScreen() {
        this.canvasContext.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
        this.canvasContext.fillStyle = rgbToHex(0, 50, 20);
        this.canvasContext.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
    }

    public get context(): RenderContext {
        return this.renderingContext;
    }
    public get rootNode(): RenderNode {
        return this._rootNode;
    }
    private onResize() {
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.render();
    }
    private prepareRenderList() {
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
        const sortArray = renderList.map(function(item, idx) {
            return { idx, item };
        });

        sortArray.sort(function(a, b) {
            if (a.item.depth < b.item.depth) return -1;
            if (a.item.depth > b.item.depth) return 1;
            return a.idx - b.idx;
        });
        return sortArray.map((element) => element.item);
    }
}
