import { logTable, MiniBench } from "../miniBench.js";

const bench = new MiniBench("ChunkId", 100000);

function makeStringId(x: number, y: number): string {
    return `x${x}y${y}`;
}
function makeNumberId(x: number, y: number): number {
    return ((x & 0xffff) << 16) | (y & 0xffff);
}

bench.add({
    name: "String-id",
    run: () => {
        for (let x = 0; x < 100; x++) {
            for (let y = 0; y < 100; y++) {
                const id = makeStringId(x, y);
            }
        }
    },
});

bench.add({
    name: "bitwise-id",
    run: () => {
        for (let x = 0; x < 100; x++) {
            for (let y = 0; y < 100; y++) {
                const id = makeNumberId(x, y);
            }
        }
    },
});

const result = bench.run();
logTable(result);
