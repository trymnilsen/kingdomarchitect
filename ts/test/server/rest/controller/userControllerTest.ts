import request from "supertest";
import { bootstrap } from "../../../../src/server/application";
describe("UserController tests", () => {
    describe("GET /user", () => {
        it("returns 200", (done) => {
            request(bootstrap())
                .get("/user")
                .set("Accept", "application/json")
                .expect(200, done);
        });
    });
});
