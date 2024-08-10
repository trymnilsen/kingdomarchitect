import * as assert from "node:assert";
import { describe, it } from "node:test";
import { EnergyComponent } from "../../../../src/game/component/energy/energyComponent.js";

describe("EnergyComponent", () => {
    it("Can increment energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.incrementEnergy(15);
        assert.equal(energyComponent.energy, 15);
    });

    it("Can decrement energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(10);
        energyComponent.decrementEnergy(6);
        assert.equal(energyComponent.energy, 4);
    });

    it("Can set energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(13);
        assert.equal(energyComponent.energy, 13);
    });

    it("Cannot set negative energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(7);
        assert.equal(energyComponent.energy, 7);

        energyComponent.setEnergy(-5);
        assert.equal(energyComponent.energy, 0);
    });

    it("Cannot decrement to negative energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(5);
        energyComponent.decrementEnergy(8);
        assert.equal(energyComponent.energy, 0);
    });

    it("Cannot decrement with a negative value", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(5);
        assert.throws(() => {
            energyComponent.decrementEnergy(-5);
        });
    });

    it("Cannot increment with a negative value", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(5);
        assert.throws(() => {
            energyComponent.incrementEnergy(-5);
        });
    });
});
