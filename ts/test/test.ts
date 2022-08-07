import test from "ava";

test("foo", (t) => {
    t.pass();
});

test("test1", (t) => {
    t.pass();
});

test("test2", (t) => {
    t.pass();
});

test("test3", (t) => {
    t.pass();
});

test("test4", (t) => {
    t.pass();
});

test("test5", (t) => {
    t.pass();
});

test("bar", async (t) => {
    const bar = Promise.resolve("bar");
    t.is(await bar, "bar");
});
