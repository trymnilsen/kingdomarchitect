export class BinaryHeap<T> {
    private content: T[];
    private scoreFunction: (item: T) => number;

    get size(): number {
        return this.content.length;
    }

    constructor(scoreFunction: (item: T) => number) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }

    push(item: T) {
        // Add the new element to the end of the array.
        this.content.push(item);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    }

    pop(): T {
        // Store the first element so we can return it later.
        const result = this.content[0];
        // Get the element at the end of the array.
        const end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up. In this case end should not be undefined
        if (this.content.length > 0 && end) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    }

    remove(item: T) {
        const i = this.content.indexOf(item);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        const end = this.content.pop();

        //If the index of
        if (i !== this.content.length - 1 && end) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(item)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    }

    rescoreItem(item: T) {
        this.sinkDown(this.content.indexOf(item));
    }

    private sinkDown(n: number) {
        // Fetch the element that has to be sunk.
        const element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {
            // Compute the parent element's index, and fetch it.
            const parentN = ((n + 1) >> 1) - 1;
            const parent = this.content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                // Update 'n' to continue at the new position.
                n = parentN;
            }
            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    }

    private bubbleUp(n: number) {
        // Look up the target element and its score.
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);

        // eslint-disable-next-line no-constant-condition
        while (true) {
            // Compute the indices of the child elements.
            const child2N = (n + 1) << 1;
            const child1N = child2N - 1;
            // This is used to store the new position of the element, if any.
            let swap: number | null = null;
            let child1Score: number = 0;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }

            // Otherwise, we are done.
            else {
                break;
            }
        }
    }
}
