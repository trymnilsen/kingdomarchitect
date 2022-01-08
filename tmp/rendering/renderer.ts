import { RenderContext } from "./renderContext";
import { RenderNode, RenderNodeType } from "./items/renderNode";
import { rgbToHex } from "../../util/color";
import { Camera } from "./camera";
import { Point, addPoint, zeroPoint } from "../../data/point";
import {
    rectangleRenderer,
    RectangleConfiguration,
    testRectangleHit,
} from "./items/rectangle";
import { textRenderer } from "./items/text";

export interface RenderItem {
    node: RenderNode;
    transform: Point;
}

export type TypeRenderFunction = (
    renderItem: RenderItem,
    context: CanvasRenderingContext2D
) => void;

const typerRenders: { [type: string]: TypeRenderFunction } = {
    [RenderNodeType.rectangle]: rectangleRenderer,
    [RenderNodeType.text]: textRenderer,
};

export class Renderer {
    private canvasContext: CanvasRenderingContext2D;
    private renderingContext: RenderContext;
    private hitList: RenderItem[];
    private _camera: Camera;
    private _rootNode: RenderNode;

    public constructor(canvasElement: HTMLCanvasElement) {
        this._camera = new Camera();
        if (!canvasElement) {
            throw new Error(`Canvas element ${canvasElement} not found`);
        }
        window.addEventListener("resize", () => {
            //this.onResize();
        });
        this.canvasContext = canvasElement.getContext("2d");
        this.canvasContext.canvas.width = window.innerWidth;
        this.canvasContext.canvas.height = window.innerHeight;
    }

    public queryRenderItem(point: Point): RenderNode {
        const hits: RenderNode[] = [];
        for (let i = 0; i < this.hitList.length; i++) {
            const renderItem = this.hitList[i];
            if (this.testRenderItemForHit(renderItem, point)) {
                hits.push(renderItem.node);
            }
        }

        if (hits.length > 0) {
            return hits[hits.length - 1];
        } else {
            return null;
        }
    }

    public render(gameWorldNode: RenderNode, uiNode: RenderNode) {
        //Clear screen
        this.clearScreen();
        this.hitList = [];
        this.renderGameWorld(gameWorldNode);
        this.renderUi(uiNode);
    }

    private renderGameWorld(rootGameNode: RenderNode) {
        const cameraScreenSpace = this._camera.screenPosition;
        //Traverse nodes add to list, breadth first
        const renderList = this.prepareRenderList(rootGameNode);
        renderList.forEach((item) => {
            if (!!item.node.config.hitTag) {
                this.hitList.push(item);
            }
        });
        //run render method on each entry
        this.renderItems(renderList, this._camera.screenPosition);
    }

    private renderUi(rootUiNode: RenderNode) {
        //Traverse nodes add to list, breadth first
        const renderList = this.prepareRenderList(rootUiNode);
        renderList.forEach((item) => {
            if (!!item.node.config.hitTag) {
                this.hitList.push(item);
            }
        });
        //run render method on each entry
        this.renderItems(renderList, zeroPoint);
    }

    private renderItems(renderList: RenderItem[], camera: Point) {
        for (let index = 0; index < renderList.length; index++) {
            const element = renderList[index];
            element.transform = addPoint(element.transform, camera);
            if (element.node.type == RenderNodeType.container) {
                continue;
            }
            if (!this.onScreen(element.transform) && false) {
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
    private prepareRenderList(rootNode: RenderNode): RenderItem[] {
        const renderList: RenderItem[] = [];
        const queue: RenderItem[] = [
            {
                node: rootNode,
                transform: { x: rootNode.config.x, y: rootNode.config.y },
            },
        ];

        while (queue.length > 0) {
            const node = queue.shift();
            node.node.config.depth = node.node.config.depth || 0;
            if (node.node.type != RenderNodeType.container) {
                renderList.push(node);
            }
            if (!node.node.children || node.node.children.length < 1) {
                continue;
            }

            for (let i = 0; i < node.node.children.length; i++) {
                const absolutePosition = addPoint(node.transform, {
                    x: node.node.children[i].config.x,
                    y: node.node.children[i].config.y,
                });
                queue.push({
                    node: node.node.children[i],
                    transform: absolutePosition,
                });
            }
        }
        //Sort list based on depth, keep items with same depth in same order
        const sortArray = renderList.map(function (item, idx) {
            return { idx, item };
        });

        sortArray.sort(function (a, b) {
            if (a.item.node.config.depth < b.item.node.config.depth) return -1;
            if (a.item.node.config.depth > b.item.node.config.depth) return 1;
            return a.idx - b.idx;
        });
        return sortArray.map((element) => element.item);
    }

    private testRenderItemForHit(item: RenderItem, testPoint: Point): boolean {
        if (item.node.type == RenderNodeType.rectangle) {
            return testRectangleHit(
                testPoint,
                item.transform,
                item.node.config as RectangleConfiguration
            );
        } else {
            return false;
        }
    }
}