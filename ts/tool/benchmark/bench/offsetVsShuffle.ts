const NUM_CHILDREN = 4;
const ITERATIONS = 1000000;

function shuffleChildren() {
    const children = [0, 1, 2, 3];
    for (let i = children.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [children[i], children[j]] = [children[j], children[i]];
    }
    for (const child of children) {
        // Simulate processing
        const foo = child + 1;
    }
}

function offsetChildren() {
    const children = [0, 1, 2, 3];
    const startIndex = Math.floor(Math.random() * NUM_CHILDREN);
    for (let i = 0; i < NUM_CHILDREN; i++) {
        const childIndex = (startIndex + i) % NUM_CHILDREN;
        // Simulate processing
        const foo = children[childIndex] + 1;
    }
}

console.time("Shuffle");
for (let i = 0; i < ITERATIONS; i++) {
    shuffleChildren();
}
console.timeEnd("Shuffle");

console.time("Offset");
for (let i = 0; i < ITERATIONS; i++) {
    offsetChildren();
}
console.timeEnd("Offset");
