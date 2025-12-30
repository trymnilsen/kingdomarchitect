import { SparseSet } from "./sparseSet.ts";

type Rectangle = { x: number; y: number; width: number; height: number };

export class QuadTree {
    private bounds: Rectangle;
    private capacity: number;
    //If delete becomes an issue we can maybe use a set?
    private rectangles = new SparseSet<Rectangle>();
    public divided = false;

    private northeast?: QuadTree;
    private northwest?: QuadTree;
    private southeast?: QuadTree;
    private southwest?: QuadTree;
    private children: QuadTree[] = [];

    constructor(bounds: Rectangle, capacity = 4) {
        this.bounds = bounds;
        this.capacity = capacity;
    }

    private subdivide() {
        const { x, y, width, height } = this.bounds;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        this.northeast = new QuadTree(
            { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
            this.capacity,
        );
        this.northwest = new QuadTree(
            { x, y, width: halfWidth, height: halfHeight },
            this.capacity,
        );
        this.southeast = new QuadTree(
            {
                x: x + halfWidth,
                y: y + halfHeight,
                width: halfWidth,
                height: halfHeight,
            },
            this.capacity,
        );
        this.southwest = new QuadTree(
            { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
            this.capacity,
        );
        this.children = [
            this.northeast,
            this.northwest,
            this.southeast,
            this.southwest,
        ];

        this.divided = true;
    }

    insert(rect: Rectangle): boolean {
        if (!this.intersects(this.bounds, rect)) {
            return false;
        }

        if (this.rectangles.size < this.capacity - 1) {
            this.rectangles.add(rect);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        return (
            this.northeast!.insert(rect) ||
            this.northwest!.insert(rect) ||
            this.southeast!.insert(rect) ||
            this.southwest!.insert(rect)
        );
    }

    delete(rectangle: Rectangle): boolean {
        const deleted = this.rectangles.delete(rectangle);
        if (deleted) {
            return true;
        } else if (this.divided) {
            return (
                this.northeast!.delete(rectangle) ||
                this.northwest!.delete(rectangle) ||
                this.southeast!.delete(rectangle) ||
                this.southwest!.delete(rectangle)
            );
        } else {
            return false;
        }
    }

    query(range: Rectangle, recurse: boolean = true): Rectangle[] {
        const found: Rectangle[] = [];
        if (!this.intersects(this.bounds, range)) return found;

        for (let i = 0; i < this.rectangles.size; i++) {
            const rect = this.rectangles.elementAt(i);
            if (this.intersects(rect, range)) {
                found.push(rect);
            }
        }

        if (this.divided && recurse) {
            found.push(...this.northeast!.query(range));
            found.push(...this.northwest!.query(range));
            found.push(...this.southeast!.query(range));
            found.push(...this.southwest!.query(range));
        }

        return found;
    }

    private contains(a: Rectangle, b: Rectangle): boolean {
        // Calculate the right, bottom, left, and top edges of each rectangle
        const containerRight = a.x + a.width;
        const containerBottom = a.y + a.height;
        const containedRight = b.x + b.width;
        const containedBottom = b.y + b.height;

        // Check if the contained rectangle is completely within the container rectangle
        return (
            b.x >= a.x &&
            b.y >= a.y &&
            containedRight <= containerRight &&
            containedBottom <= containerBottom
        );
    }

    private intersects(a: Rectangle, b: Rectangle): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /*
    findRandomNonCollidingPosition(
        width: number,
        height: number,
    ): Rectangle | null {
        return this.findEmptyRegion(this, width, height);
    }

    private findEmptyRegion(
        node: QuadTree,
        width: number,
        height: number,
    ): Rectangle | null {
        // Ensure the rectangle fits within the current node
        if (width > node.bounds.width || height > node.bounds.height)
            return null;

        for (let i = 0; i < this.rectangles.size; i++) {
            const rectangle = this.rectangles.elementAt(i);
            //Check if any of the rectangles would fit this size
            if (rectangle.width >= width && rectangle.width >= height) {
                return rectangle;
            }
        }

        // If the node is divided, check children in an offset order
        if (node.divided) {
            // Generate a random offset
            const startIndex = Math.floor(Math.random() * node.children.length);

            // Iterate over children starting from the random offset
            for (let i = 0; i < node.children.length; i++) {
                const childIndex = (startIndex + i) % node.children.length;
                const result = this.findEmptyRegion(
                    node.children[childIndex],
                    width,
                    height,
                );

                if (!!result) {
                    return result;
                }
            }
        }

        return null; // No valid region found
    }*/
}

/*
export function placeWithTilesplit(
    quadTree: QuadTree,
    width: number,
    height: number,
): Rectangle | null {
    console.profile("placeWithTilesplit");
    const region = quadTree.findRandomNonCollidingPosition(width, height);
    if (!!region) {
        let x = region.x;
        let y = region.y;
        if (region.width > width) {
            const randomRange = region.width - width;
            const offset = Math.round(Math.random() * randomRange);
            x += offset;
        }
        if (region.height > height) {
            const randomRange = region.height - height;
            const offset = Math.round(Math.random() * randomRange);
            y += offset;
        }
        const itemRectangle: Rectangle = {
            x,
            y,
            width,
            height,
        };
        //Remove the rectangle from the quadtree
        quadTree.delete(region);
        //Split the rectangle
        const splits = splitRectangle(region, itemRectangle);
        //add the split rectangles into the quadtree
        for (let i = 0; i < splits.length; i++) {
            quadTree.insert(splits[i]);
        }
        return itemRectangle;
    } else {
        console.count("No remaining space");
        return null;
    }
    console.profileEnd("placeWithTilesplit");
}*/
