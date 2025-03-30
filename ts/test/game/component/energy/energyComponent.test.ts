import { describe, it, expect } from "vitest";
import { EnergyComponent } from "../../../../src/game/componentOld/energy/energyComponent.js";

describe("EnergyComponent", () => {
    it("Can increment energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.incrementEnergy(15);
        expect(energyComponent.energy).toBe(15);
    });

    it("Can decrement energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(10);
        energyComponent.decrementEnergy(6);
        expect(energyComponent.energy).toBe(4);
    });

    it("Can set energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(13);
        expect(energyComponent.energy).toBe(13);
    });

    it("Cannot set negative energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(7);
        expect(energyComponent.energy).toBe(7);

        energyComponent.setEnergy(-5);
        expect(energyComponent.energy).toBe(0);
    });

    it("Cannot decrement to negative energy", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(5);
        energyComponent.decrementEnergy(8);
        expect(energyComponent.energy).toBe(0);
    });

    it("Cannot decrement with a negative value", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(5);
        expect(() => {
            energyComponent.decrementEnergy(-5);
        }).toThrow();
    });

    it("Cannot increment with a negative value", () => {
        const energyComponent = new EnergyComponent();
        energyComponent.setEnergy(5);
        expect(() => {
            energyComponent.incrementEnergy(-5);
        }).toThrow();
    });
});
