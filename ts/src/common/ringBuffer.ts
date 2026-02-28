export type RingBuffer<T> = {
    entries: (T | undefined)[];
    capacity: number;
    writeHead: number;
    total: number;
};

export function createRingBuffer<T>(capacity: number): RingBuffer<T> {
    return {
        entries: new Array(capacity).fill(undefined),
        capacity,
        writeHead: 0,
        total: 0,
    };
}

export function writeEntry<T>(buffer: RingBuffer<T>, entry: T): void {
    buffer.entries[buffer.writeHead] = entry;
    buffer.writeHead = (buffer.writeHead + 1) % buffer.capacity;
    buffer.total += 1;
}

/**
 * Returns all entries in the buffer ordered from oldest to newest.
 */
export function readEntries<T>(buffer: RingBuffer<T>): T[] {
    const size = Math.min(buffer.total, buffer.capacity);
    const result: T[] = [];

    if (size === 0) {
        return result;
    }

    // When the buffer is full, the oldest entry is at writeHead.
    // When not full, entries start at index 0.
    const startIndex =
        buffer.total >= buffer.capacity ? buffer.writeHead : 0;

    for (let i = 0; i < size; i++) {
        const index = (startIndex + i) % buffer.capacity;
        const entry = buffer.entries[index];
        if (entry !== undefined) {
            result.push(entry);
        }
    }

    return result;
}

/**
 * Returns the last n entries in the buffer ordered from oldest to newest.
 * If n exceeds the number of stored entries, all entries are returned.
 */
export function tailEntries<T>(buffer: RingBuffer<T>, n: number): T[] {
    const all = readEntries(buffer);
    return all.length <= n ? all : all.slice(all.length - n);
}
