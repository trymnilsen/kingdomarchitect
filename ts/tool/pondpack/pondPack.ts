import * as fs from "fs/promises";
import * as path from "path";
import { readPng } from "../util/pngHelper.ts";
import {
    dedupeMasks,
    generatePondShapesSource,
    readPondMask,
    type PondMaskEntry,
} from "./pondMask.ts";

const tilesetPath = path.join(process.cwd(), "tileset");
const outputPath = path.join(process.cwd(), "ts", "generated", "pondShapes.ts");
const pondFilePattern = /^pond\.(\d+)\.png$/;

run();

async function run() {
    const pondFiles = (await fs.readdir(tilesetPath))
        .map((file) => ({ file, match: pondFilePattern.exec(file) }))
        .filter((candidate) => candidate.match !== null)
        .sort((a, b) => Number(a.match![1]) - Number(b.match![1]))
        .map((candidate) => candidate.file);

    if (pondFiles.length === 0) {
        throw new Error(`No pond bitmaps found in ${tilesetPath}`);
    }

    const entries: PondMaskEntry[] = pondFiles.map((file) => ({
        file,
        mask: readPondMask(readPng(path.join(tilesetPath, file)), file),
    }));

    const { unique, duplicates } = dedupeMasks(entries);
    for (const duplicate of duplicates) {
        console.warn(
            `${duplicate.file} has the same shape as ${duplicate.duplicateOf} and is skipped`,
        );
    }

    await fs.writeFile(outputPath, generatePondShapesSource(unique));
    console.log(
        `Wrote ${unique.length} pond shapes from ${pondFiles.length} bitmaps to ${path.relative(process.cwd(), outputPath)}`,
    );
}
