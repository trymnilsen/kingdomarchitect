import assert from "node:assert";
import { describe, it } from "node:test";
import {
    BuildCommand,
    BuildCommandId,
} from "../../../../src/server/message/command/buildCommand.ts";
import { nullBuilding, type Building } from "../../../../src/data/building/building.ts";

function createTestBuilding(id: string): Building {
    return {
        ...nullBuilding,
        id,
        name: "Test Building",
    };
}

describe("BuildCommand", () => {
    it("creates command with correct id", () => {
        const building = createTestBuilding("stockpile");

        const command = BuildCommand(building, { x: 100, y: 200 });

        assert.strictEqual(command.id, BuildCommandId);
        assert.strictEqual(command.id, "build");
    });

    it("uses building ID from building object", () => {
        const building = createTestBuilding("warehouse");

        const command = BuildCommand(building, { x: 50, y: 75 });

        assert.strictEqual(command.buildingId, "warehouse");
    });

    it("accepts single position", () => {
        const building = createTestBuilding("house");

        const command = BuildCommand(building, { x: 100, y: 200 });

        assert.deepStrictEqual(command.position, { x: 100, y: 200 });
    });

    it("accepts array of positions", () => {
        const building = createTestBuilding("wall");
        const positions = [
            { x: 100, y: 200 },
            { x: 101, y: 200 },
            { x: 102, y: 200 },
        ];

        const command = BuildCommand(building, positions);

        assert.ok(Array.isArray(command.position));
        assert.strictEqual((command.position as any[]).length, 3);
        assert.deepStrictEqual(command.position, positions);
    });

    it("creates separate commands for different buildings", () => {
        const building1 = createTestBuilding("stockpile");
        const building2 = createTestBuilding("warehouse");

        const command1 = BuildCommand(building1, { x: 0, y: 0 });
        const command2 = BuildCommand(building2, { x: 10, y: 10 });

        assert.strictEqual(command1.buildingId, "stockpile");
        assert.strictEqual(command2.buildingId, "warehouse");
    });
});
