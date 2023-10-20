import * as fs from "fs";
import ts from "typescript";
import * as path from "path";
import { EntityComponent } from "../../src/game/component/entityComponent.js";
import { Job } from "../../src/game/component/job/job.js";
import { getClasses } from "./typescriptHelper.js";
import { OutputObject } from "./outputObject.js";

const configPath = path.join(process.cwd());
const entityComponentName = EntityComponent.name;
const jobName = Job.name;

function makeTypeLists() {
    const program = ts.createProgram({
        rootNames: [path.join(configPath, "ts", "src", "main.ts")],
        options: {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS,
        },
    });

    const components = getClasses(program, configPath, entityComponentName);
    const jobs = getClasses(program, configPath, jobName);

    writeComponentsFile(components);
    writeJobsFile(jobs);
}

function writeComponentsFile(objects: OutputObject[]) {
    const imports = objects.map((object) => {
        const filePath = object.filepath.replace(".ts", ".js");

        return `import { ${object.name} } from "${filePath}";`;
    });

    const entries = objects.map((object) => {
        return `    ${object.name},`;
    });

    const generatedCode = [
        'import { ConstructorFunction } from "../src/common/constructor.js"',
        'import { EntityComponent } from "../src/game/component/entityComponent.js"',
        ...imports,
        "",
        "export const componentLoaders: ConstructorFunction<EntityComponent>[] = [",
        ...entries,
        "];",
        "",
    ].join("\n");

    fs.writeFileSync(
        path.join(configPath, "ts", "generated", "componentLoader.ts"),
        generatedCode,
    );
}

function writeJobsFile(objects: OutputObject[]) {
    const imports = objects.map((object) => {
        const filePath = object.filepath.replace(".ts", ".js");

        return `import { ${object.name} } from "${filePath}";`;
    });

    const entries = objects.map((object) => {
        return `    ${object.name},`;
    });

    const generatedCode = [
        'import { ConstructorFunction } from "../src/common/constructor.js"',
        'import { Job } from "../src/game/component/job/job.js"',
        ...imports,
        "",
        "export const jobLoaders: ConstructorFunction<Job>[] = [",
        ...entries,
        "];",
        "",
    ].join("\n");

    fs.writeFileSync(
        path.join(configPath, "ts", "generated", "jobLoader.ts"),
        generatedCode,
    );
}

makeTypeLists();
