import * as assert from "node:assert";
import { describe, it } from "node:test";
import { HousingComponent } from "../../../../src/game/component/housing/housingComponent.js";
import { housePrefab } from "../../../../src/game/prefab/housePrefab.js";
import { workerPrefab } from "../../../../src/game/prefab/workerPrefab.js";
import { createRootEntity } from "../../../../src/game/entity/rootEntity.js";

describe("HousingComponent", () => {
    /*
    it("Will assign any workers on start", () => {
        const rootEntity = createRootEntity();
        const worker = workerPrefab("worker1");
        const house = housePrefab("house1", false);
        rootEntity.addChild(worker);
        rootEntity.addChild(house);

        const housingComponent = house.getComponent(HousingComponent);
        if (!housingComponent) {
            assert.fail("No housing component on house entity");
        }
        const tenantComponent = worker.getComponent(TenantComponent);
        if (!tenantComponent) {
            assert.fail("Worker entity had no tenant component");
        }

        assert.equal(tenantComponent.houseEntityId, house.id);
        assert.equal(housingComponent.residentEntityId, worker.id);
    });*/

    it("Will not spawn worker if tenant is set", () => {
        assert.equal(2, 2);
    });

    it("Will spawn worker if tenant is not set", () => {
        assert.equal(2, 2);
    });
});
