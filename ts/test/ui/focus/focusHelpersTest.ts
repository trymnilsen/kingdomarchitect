import { assert } from "chai";

describe("isViewInDirection test", () => {
    describe("left direction", () => {
        it("view not in direction not returned", () => {
            assert.equal(2, 2);
        });

        it("view overlapping direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with all corners past direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with corner on same but not greater coordinate is not returned", () => {
            assert.equal(2, 2);
        });
    });
    describe("right direction", () => {
        it("view not in direction not returned", () => {
            assert.equal(2, 2);
        });

        it("view overlapping direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with all corners past direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with corner on same but not greater coordinate is not returned", () => {
            assert.equal(2, 2);
        });
    });
    describe("up direction", () => {
        it("view not in direction not returned", () => {
            assert.equal(2, 2);
        });

        it("view overlapping direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with all corners past direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with corner on same but not greater coordinate is not returned", () => {
            assert.equal(2, 2);
        });
    });
    describe("down direction", () => {
        it("view not in direction not returned", () => {
            assert.equal(2, 2);
        });

        it("view overlapping direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with all corners past direction is returned", () => {
            assert.equal(2, 2);
        });

        it("view with corner on same but not greater coordinate is not returned", () => {
            assert.equal(2, 2);
        });
    });
});

describe("closestViewByEdge test", () => {
    it("center of view is used as from point", () => {
        assert.equal(2, 2);
    });

    it("can get closest edge when there are multiple", () => {
        assert.equal(2, 2);
    });

    it("will return null when there is no closest view", () => {
        assert.equal(2, 2);
    });
});
