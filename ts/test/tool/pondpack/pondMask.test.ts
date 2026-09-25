import assert from "node:assert";
import { describe, it } from "node:test";
import { PNG } from "pngjs";
import { isMaskSet, type TileMask } from "../../../src/game/map/tileMask.ts";
import {
    dedupeMasks,
    formatMaskSource,
    PondWaterColor,
    readPondMask,
} from "../../../tool/pondpack/pondMask.ts";
import type { PixelColor } from "../../../tool/util/pixels.ts";

const transparent: PixelColor = { red: 0, green: 0, blue: 0, alpha: 0 };

function pondPng(rows: string[]): PNG {
    const png = new PNG({ width: rows[0].length, height: rows.length });
    for (let y = 0; y < rows.length; y++) {
        for (let x = 0; x < rows[y].length; x++) {
            let color = transparent;
            if (rows[y][x] === "W") {
                color = PondWaterColor;
            }
            setPixel(png, x, y, color);
        }
    }
    return png;
}

function setPixel(png: PNG, x: number, y: number, color: PixelColor) {
    const index = (png.width * y + x) << 2;
    png.data[index] = color.red;
    png.data[index + 1] = color.green;
    png.data[index + 2] = color.blue;
    png.data[index + 3] = color.alpha;
}

describe("readPondMask", () => {
    it("trims the transparent margin around the water", () => {
        const mask = readPondMask(
            pondPng(["......", "...W..", "..WWW.", "...W..", "......"]),
            "pond.test.png",
        );

        assert.deepStrictEqual(mask, {
            width: 3,
            height: 3,
            rows: [0b010, 0b111, 0b010],
        });
    });

    it("rejects a colour that is neither water nor transparent", () => {
        const png = pondPng(["WW..", ".WW."]);
        setPixel(png, 3, 1, { red: 0, green: 162, blue: 95, alpha: 255 });

        assert.throws(
            () => readPondMask(png, "pond.7.png"),
            /pond\.7\.png has an unknown colour rgba\(0, 162, 95, 255\) at 3\/1/,
        );
    });

    it("rejects half transparent water", () => {
        const png = pondPng(["WW", "WW"]);
        setPixel(png, 1, 1, { ...PondWaterColor, alpha: 128 });

        assert.throws(() => readPondMask(png, "pond.2.png"), /at 1\/1/);
    });

    it("rejects a bitmap without water", () => {
        assert.throws(
            () => readPondMask(pondPng(["...", "..."]), "pond.9.png"),
            /pond\.9\.png has no water pixels/,
        );
    });
});

describe("dedupeMasks", () => {
    it("keeps the first of identical shapes and reports the rest", () => {
        const square: TileMask = { width: 2, height: 2, rows: [0b11, 0b11] };
        const bar: TileMask = { width: 3, height: 1, rows: [0b111] };

        const { unique, duplicates } = dedupeMasks([
            { file: "pond.3.png", mask: square },
            { file: "pond.4.png", mask: bar },
            { file: "pond.5.png", mask: { ...square, rows: [0b11, 0b11] } },
        ]);

        assert.deepStrictEqual(
            unique.map((entry) => entry.file),
            ["pond.3.png", "pond.4.png"],
        );
        assert.deepStrictEqual(duplicates, [
            { file: "pond.5.png", duplicateOf: "pond.3.png" },
        ]);
    });
});

describe("formatMaskSource", () => {
    it("writes rows as padded binary literals that evaluate to the mask", () => {
        const mask: TileMask = {
            width: 5,
            height: 3,
            rows: [0b00110, 0b11111, 0b00001],
        };
        const source = formatMaskSource({ file: "pond.12.png", mask });

        assert.strictEqual(
            source,
            "{ width: 5, height: 3, rows: [0b00110, 0b11111, 0b00001] }, // pond.12.png",
        );

        const literal = source.slice(0, source.lastIndexOf("},") + 1);
        const evaluated = new Function(`return ${literal};`)() as TileMask;
        assert.deepStrictEqual(evaluated, mask);
        assert.strictEqual(isMaskSet(evaluated, 4, 2), true);
        assert.strictEqual(isMaskSet(evaluated, 0, 2), false);
    });
});
