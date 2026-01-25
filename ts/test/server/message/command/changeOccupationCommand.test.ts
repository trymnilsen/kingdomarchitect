import assert from "node:assert";
import { describe, it } from "node:test";
import { Entity } from "../../../../src/game/entity/entity.ts";
import {
    ChangeOccupationCommand,
    ChangeOccupationCommandId,
} from "../../../../src/server/message/command/changeOccupationCommand.ts";

describe("ChangeOccupationCommand", () => {
    it("creates command with correct id", () => {
        const worker = new Entity("worker1");
        const workplace = new Entity("farm1");

        const command = ChangeOccupationCommand(worker, workplace, "assign");

        assert.strictEqual(command.id, ChangeOccupationCommandId);
        assert.strictEqual(command.id, "changeOccupation");
    });

    it("uses entity ids from worker and workplace", () => {
        const worker = new Entity("villager1");
        const workplace = new Entity("blacksmith1");

        const command = ChangeOccupationCommand(worker, workplace, "assign");

        assert.strictEqual(command.worker, "villager1");
        assert.strictEqual(command.workplace, "blacksmith1");
    });

    it("stores assign action", () => {
        const worker = new Entity("worker");
        const workplace = new Entity("workplace");

        const command = ChangeOccupationCommand(worker, workplace, "assign");

        assert.strictEqual(command.action, "assign");
    });

    it("stores unassign action", () => {
        const worker = new Entity("worker");
        const workplace = new Entity("workplace");

        const command = ChangeOccupationCommand(worker, workplace, "unassign");

        assert.strictEqual(command.action, "unassign");
    });

    it("creates separate commands for different actions", () => {
        const worker = new Entity("worker1");
        const workplace = new Entity("farm1");

        const assignCommand = ChangeOccupationCommand(worker, workplace, "assign");
        const unassignCommand = ChangeOccupationCommand(worker, workplace, "unassign");

        assert.strictEqual(assignCommand.action, "assign");
        assert.strictEqual(unassignCommand.action, "unassign");
        assert.strictEqual(assignCommand.worker, unassignCommand.worker);
        assert.strictEqual(assignCommand.workplace, unassignCommand.workplace);
    });
});
