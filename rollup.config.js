import { defineConfig } from "rollup";
import sourcemaps from "rollup-plugin-sourcemaps2";
import path from "path";

const CWD = process.cwd();

/**
 * Creates a sourcemapPathTransform function that prepends a prefix
 * to a project-relative path.
 * @param {string} prefix - The prefix to add (e.g., "game:///" or "worker:///")
 */
const createSourcePathTransformer = (prefix) => {
    return (relativePath, sourcemapPath) => {
        // Resolve the absolute path to the original source file
        const absPath = path.resolve(path.dirname(sourcemapPath), relativePath);

        // Get the path relative to your project root (CWD)
        const projectRelPath = path.relative(CWD, absPath);

        // Prepend prefix and normalize separators
        return `${prefix}${projectRelPath.replace(/\\/g, "/")}`;
    };
};

export default [
    {
        input: "build/src/main.js",
        plugins: [sourcemaps()],
        output: {
            sourcemap: true,
            file: "public/dist/bundle.js",
            format: "esm",
            // Use the factory function
            sourcemapPathTransform: createSourcePathTransformer("game:///"),
        },
    },
    {
        input: "build/src/server/webWorkerServer.js",
        plugins: [sourcemaps()],
        output: {
            sourcemap: true,
            file: "public/dist/server/webWorkerServer.js",
            format: "esm",
            // Use the factory function with a different prefix
            sourcemapPathTransform: createSourcePathTransformer("worker:///"),
        },
    },
];
