import { MiniBench } from "../miniBench.js";

const bench = new MiniBench("Remove item", 1000);
bench.add({
    name: "filter",
    run: () => {
        [1, 2, 3, 4, 5, 6, 7, 8].filter((item) => item != 5);
    },
});
bench.add({
    name: "delete",
    run: () => {
        const map = new Map();
        for (let i = 0; i < 10; i++) {
            map.set(i, i);
        }
        map.delete(5);
    },
});

bench.run();
