import * as fs from "fs/promises";
import * as path from "path";

/**
 * Recursively collects .png and .json files from a directory, ignoring files and folders starting with '_'.
 */
export async function collectAssetFiles(
    dir: string,
): Promise<{ pngFiles: string[]; jsonFiles: string[] }> {
    const pngFiles: string[] = [];
    const jsonFiles: string[] = [];

    async function walk(currentDir: string) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith("_")) continue;
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (entry.isFile()) {
                if (entry.name.endsWith(".png")) {
                    pngFiles.push(fullPath);
                } else if (entry.name.endsWith(".json")) {
                    jsonFiles.push(fullPath);
                }
            }
        }
    }
    await walk(dir);
    return { pngFiles, jsonFiles };
}
