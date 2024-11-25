export interface ReadableSet<T> {
    size: number;
    elementAt(index: number): T;
}

export class SparseSet<T> implements ReadableSet<T> {
    private dense: Array<T>;
    private sparse: Map<T, number>;

    constructor() {
        this.dense = [];
        this.sparse = new Map<T, number>();
    }

    get size(): number {
        return this.dense.length;
    }

    elementAt(index: number): T {
        if (index < 0 || index >= this.dense.length) {
            throw new Error("Index out of bounds");
        }
        return this.dense[index];
    }

    contains(key: T) {
        let denseIndex = this.sparse.get(key);

        if (denseIndex === undefined || denseIndex >= this.dense.length) {
            return false;
        }

        let denseItem = this.dense[denseIndex];

        return denseItem === key;
    }

    delete(key: T) {
        if (!this.contains(key)) {
            return;
        }

        const denseIndex = this.sparse.get(key)!;
        const lastItem = this.dense.pop()!; // Remove the last item from dense

        // If we're not removing the last element, swap and update indices
        if (denseIndex < this.dense.length) {
            this.dense[denseIndex] = lastItem;
            this.sparse.set(lastItem, denseIndex);
        }

        // Remove the key from the sparse map
        this.sparse.delete(key);
    }

    add(item: T) {
        if (this.contains(item)) {
            return;
        }

        this.sparse.set(item, this.dense.length);
        this.dense.push(item);
    }
}
