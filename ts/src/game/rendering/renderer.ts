import { RenderContext } from "./renderContext";
import { RenderNode, RenderNodeType } from "./items/renderNode";
import { rgbToHex } from "../../util/color";
import { Camera } from "./camera";
import { Point, addPoint } from "../../data/point";
import { rectangleRenderer } from "./items/rectangle";

export interface RenderItem {
    node: RenderNode;
    transform: Point;
}

export type TypeRenderFunction = (
    renderItem: RenderItem,
    context: CanvasRenderingContext2D
) => void;

const typerRenders: { [type: string]: TypeRenderFunction } = {
    [RenderNodeType.rectangle]: rectangleRenderer
};

export class Renderer {
    private canvasContext: CanvasRenderingContext2D;
    private renderingContext: RenderContext;
    private _camera: Camera;
    private _rootNode: RenderNode;

    public constructor(canvasElementId: string) {
        this._camera = new Camera();
        const canvasElement: HTMLCanvasElement = document.querySelector(
            `#${canvasElementId}`
        );
        if (!canvasElement) {
            throw new Error(`Canvas element ${canvasElementId} not found`);
        }
        window.addEventListener("resize", () => {
            //this.onResize();
        });
        this.canvasContext = canvasElement.getContext("2d");
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
    }

    public render(rootNode: RenderNode) {
        const startTime = performance.now();
        const cameraScreenSpace = this._camera.screenPosition;
        //Traverse nodes add to list, breadth first
        const renderList = this.prepareRenderList(rootNode);
        //Clear screen
        this.clearScreen();
        //run render method on each entry
        this.renderItems(renderList, this._camera.screenPosition);
        const endTime = performance.now();
        //console.log("Render time: " + (endTime - startTime));
    }

    private renderItems(renderList: RenderItem[], camera: Point) {
        for (let index = 0; index < renderList.length; index++) {
            const element = renderList[index];
            element.transform = addPoint(element.transform, camera);
            if (element.node.type == RenderNodeType.container) {
                continue;
            }
            if (!this.onScreen(element.transform)) {
                continue;
            }
            const typeRender = typerRenders[element.node.type];
            if (!!typeRender) {
                typeRender(element, this.canvasContext);
            } else {
                console.warn("no render found for type", element.node.type);
            }
        }
    }
    private onScreen(point: Point) {
        return (
            point.x >= 0 &&
            point.y >= 0 &&
            point.x <= window.innerWidth &&
            point.y <= window.innerHeight
        );
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
    public get camera(): Camera {
        return this._camera;
    }
    public get context(): RenderContext {
        return this.renderingContext;
    }
    public get rootNode(): RenderNode {
        return this._rootNode;
    }
    /*     private onResize() {
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
        this.render();
    } */
    private prepareRenderList(rootNode: RenderNode) {
        const renderList: RenderItem[] = [];
        const queue: RenderItem[] = [
            {
                node: rootNode,
                transform: { x: rootNode.config.x, y: rootNode.config.y }
            }
        ];

        while (queue.length > 0) {
            const node = queue.shift();
            node.node.config.depth = node.node.config.depth || 0;
            renderList.push(node);
            if (!node.node.children || node.node.children.length < 1) {
                continue;
            }

            for (let i = 0; i < node.node.children.length; i++) {
                const absolutePosition = addPoint(
                    {
                        x: node.node.config.x,
                        y: node.node.config.y
                    },
                    {
                        x: node.node.children[i].config.x,
                        y: node.node.children[i].config.y
                    }
                );
                queue.push({
                    node: node.node.children[i],
                    transform: absolutePosition
                });
            }
        }
        //Sort list based on depth, keep items with same depth in same order
        const sortArray = renderList.map(function(item, idx) {
            return { idx, item };
        });

        sortArray.sort(function(a, b) {
            if (a.item.node.config.depth < b.item.node.config.depth) return -1;
            if (a.item.node.config.depth > b.item.node.config.depth) return 1;
            return a.idx - b.idx;
        });
        return sortArray.map((element) => element.item);
    }
}
