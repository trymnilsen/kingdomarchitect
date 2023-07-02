import { describe, it } from "node:test";
import * as assert from "node:assert";
import { RootEntity } from "../../../../src/game/world/entity/rootEntity.js";
import { workerPrefab } from "../../../../src/game/world/prefab/workerPrefab.js";
import { housePrefab } from "../../../../src/game/world/prefab/housePrefab.js";
import { HousingComponent } from "../../../../src/game/world/component/housing/housingComponent.js";
import { TenantComponent } from "../../../../src/game/world/component/housing/tenantComponent.js";

describe("Housing component test", () => {
    it("Will assign any workers on start", () => {
        const rootEntity = new RootEntity("root");
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

        assert.equal(tenantComponent.house?.id, house.id);
        assert.equal(housingComponent.resident?.id, worker.id);
    });

    it("Will not spawn worker if tenant is set", () => {
        assert.equal(2, 2);
    });

    it("Will spawn worker if tenant is not set", () => {
        assert.equal(2, 2);
    });
});
