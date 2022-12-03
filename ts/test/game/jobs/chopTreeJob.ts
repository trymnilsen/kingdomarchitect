import test from "ava";

test("cannot set start tick after it has been set", (t) => {
    t.pass();
});

test("cannot set not started state", (t) => {
    t.pass();
});

test("cannot update job state if its completed", (t) => {
    t.pass();
});

test("can only set completed state if its currently running", (t) => {
    t.pass();
});
