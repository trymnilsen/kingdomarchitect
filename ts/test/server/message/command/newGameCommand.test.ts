import assert from "node:assert";
import { describe, it } from "node:test";
import {
    NewGameCommand,
    NewGameCommandId,
} from "../../../../src/server/message/command/newGameCommand.ts";

describe("NewGameCommand", () => {
    it("creates command with correct id", () => {
        const command = NewGameCommand();

        assert.strictEqual(command.id, NewGameCommandId);
        assert.strictEqual(command.id, "newgame");
    });

    it("creates identical commands on multiple calls", () => {
        const command1 = NewGameCommand();
        const command2 = NewGameCommand();

        assert.strictEqual(command1.id, command2.id);
    });
});
