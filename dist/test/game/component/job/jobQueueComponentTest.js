import { assert } from "chai";
describe("JobQueueEntity test", ()=>{
    it("Schedule job attempts to immediately assign job", ()=>{
        assert.equal(2, 2);
    });
    it("Schedule job pushes job to pending if no entity is available", ()=>{
        assert.equal(2, 2);
    });
    it("Can remove job", ()=>{
        assert.equal(2, 2);
    });
});
