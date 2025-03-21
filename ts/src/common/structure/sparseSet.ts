export interface ReadableSet<T, K = T> {
    size: number;
    elementAt(index: number): T;
    get(key: K): T | undefined;
}

export class SparseSet<T, K = T> implements ReadableSet<T, K> {
    dense: Array<T>;
    sparse: Map<K, number>;
    private keySelector: (item: T) => K;

    constructor(keySelector: (item: T) => K = (item) => item as unknown as K) {
        this.dense = [];
        this.sparse = new Map<K, number>();
        this.keySelector = keySelector;
    }

    get size(): number {
        return this.dense.length;
    }

    get(key: K) {
        const index = this.sparse.get(key);
        if (index !== undefined) {
            return this.dense[index];
        } else {
            return undefined;
        }
    }

    elementAt(index: number): T {
        if (index < 0 || index >= this.dense.length) {
            throw new Error("Index out of bounds");
        }
        return this.dense[index];
    }

    contains(key: K) {
        return this.sparse.has(key);
    }

    delete(key: K): boolean {
        if (!this.contains(key)) {
            return false;
        }

        const denseIndex = this.sparse.get(key)!;
        const lastItem = this.dense.pop()!; // Remove the last item from dense

        // If we're not removing the last element, swap and update indices
        if (denseIndex < this.dense.length) {
            this.dense[denseIndex] = lastItem;
            this.sparse.set(this.keySelector(lastItem), denseIndex);
        }

        // Remove the key from the sparse map
        this.sparse.delete(key);
        return true;
    }

    add(item: T) {
        const key = this.keySelector(item);
        if (this.contains(key)) {
            return;
        }

        this.sparse.set(key, this.dense.length);
        this.dense.push(item);
    }
}
