import test from "ava";

test("update only updates current job", (t) => {
    t.pass();
});

test("draw only draws current job", (t) => {
    t.pass();
});

test("cannot set empty list of jobs", (t) => {
    t.pass();
});

test("can only set list of jobs before its started", (t) => {
    t.pass();
});

test("run sub job sets state and actor", (t) => {
    t.pass();
});

test("run sub job starts onStart", (t) => {
    t.pass();
});

test("subJobListener is added on runJob", (t) => {
    t.pass();
});

test("next job is ran when previous step completes", (t) => {
    t.pass();
});

test("job step is removed when it completes", (t) => {
    t.pass();
});

test("parent job completes when the last step job completes", (t) => {
    t.pass();
});

test("can only set completed state if its currently running", (t) => {
    t.pass();
});
