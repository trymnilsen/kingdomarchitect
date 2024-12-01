import { logTable, MiniBench } from "../miniBench.js";

const numberOfComponents = 10000;

class IncrementData {
    value: number = 0;
}

class BenchmarkComponent {
    constructor(private amount: number) {}
    update(data: IncrementData) {
        //Doing some work
        data.value += Math.floor(Math.random() * this.amount);
    }
}

class BenchmarkEntity {
    components: BenchmarkComponent[] = [];
    children: BenchmarkEntity[] = [];
    doWork(incrementData: IncrementData) {
        for (let i = 0; i < this.components.length; i++) {
            const element = this.components[i];
            element.update(incrementData);
        }
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            child.doWork(incrementData);
        }
    }
}

function makeBenchmarkEntity(): BenchmarkEntity {
    const entity = new BenchmarkEntity();
    for (let i = 0; i < 10; i++) {
        entity.components.push(
            new BenchmarkComponent(Math.floor(Math.random() * 10)),
        );
    }
    return entity;
}

function generateTree(
    totalNodes: number,
    maxDepth: number,
): BenchmarkEntity | null {
    if (totalNodes <= 0 || maxDepth <= 0) return null;

    // Counter for assigning values to nodes
    let currentValue = 1;

    // Create the root node
    const root: BenchmarkEntity = makeBenchmarkEntity();

    // A queue to manage nodes that can receive children, along with their current depth
    const nodeQueue: { node: BenchmarkEntity; depth: number }[] = [
        { node: root, depth: 1 },
    ];

    while (currentValue <= totalNodes) {
        const item = nodeQueue.shift();
        if (!item) break;

        const { node: parentNode, depth } = item;

        // Stop adding children if we've reached the maximum depth
        if (depth >= maxDepth) continue;

        while (currentValue <= totalNodes) {
            const childNode: BenchmarkEntity = makeBenchmarkEntity();
            parentNode.children.push(childNode);
            nodeQueue.push({ node: childNode, depth: depth + 1 });
            currentValue++;
            // Break if there are no remaining nodes
            if (currentValue > totalNodes) break;
        }
    }

    return root;
}

function createEntities(count: number): BenchmarkEntity {
    const numberOfEntities = count / 10;
    return generateTree(numberOfEntities, 2)!;
}

function createArray(count: number): BenchmarkComponent[] {
    const array: BenchmarkComponent[] = [];
    for (let i = 0; i < count; i++) {
        array.push(new BenchmarkComponent(Math.floor(Math.random() * 10)));
    }

    return array;
}

type EntitySetupData = {
    entity: BenchmarkEntity;
    numberStore: IncrementData;
};

type ArraySetupData = {
    components: BenchmarkComponent[];
    numberStore: IncrementData;
};

const bench = new MiniBench("Nested iteration", 1000);
bench.add({
    name: "Nested children",
    setup: () => {
        return {
            entity: createEntities(numberOfComponents),
            numberStore: new IncrementData(),
        };
    },
    run: (data) => {
        (data as EntitySetupData).entity.doWork(
            (data as EntitySetupData).numberStore,
        );
    },
});
bench.add({
    name: "Straight array",
    setup: () => {
        return {
            components: createEntities(numberOfComponents),
            numberStore: new IncrementData(),
        };
    },
    run: (data) => {
        const array = (data as ArraySetupData).components;
        for (let i = 0; i < array.length; i++) {
            const element = array[i];
            element.update((data as ArraySetupData).numberStore);
        }
    },
});

const benchResult = bench.run();
logTable(benchResult);
