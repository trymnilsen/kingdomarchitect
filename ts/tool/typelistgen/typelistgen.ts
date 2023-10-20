import * as fs from "fs";
import ts from "typescript";
import * as path from "path";
import { EntityComponent } from "../../src/game/component/entityComponent.js";

const configPath = path.join(process.cwd());
const entityComponentName = EntityComponent.name;

type OutputObject = {
    name: string;
    filepath: string;
};

function makeList() {
    const program = ts.createProgram({
        rootNames: [path.join(configPath, "ts", "src", "main.ts")],
        options: {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS,
        },
    });

    const output: OutputObject[] = [];

    let checker = program.getTypeChecker();

    function getBaseType(type: ts.Type): string {
        let baseTypeName = "undefined";
        let typeToFindBaseOf = type;
        do {
            const baseType = typeToFindBaseOf.getBaseTypes();
            if (baseType && baseType[0]) {
                const parentType = checker.getBaseTypeOfLiteralType(
                    baseType[0],
                );
                baseTypeName = parentType.symbol.name;
                typeToFindBaseOf = parentType;
            } else {
                break;
            }
        } while (true);

        return baseTypeName;
    }

    function visit(node: ts.Node, sourceFile: ts.SourceFile) {
        if (!isNodeExported(node)) {
            return;
        }

        if (nodeHasModifier(node, ts.ModifierFlags.Abstract)) {
            return;
        }

        if (ts.isClassDeclaration(node) && node.name) {
            let symbol = checker.getSymbolAtLocation(node.name);

            if (symbol) {
                const classType = checker.getTypeAtLocation(node);
                if (classType.getBaseTypes()?.length ?? 0 > 0) {
                    const baseType = getBaseType(classType);
                    if (baseType == entityComponentName) {
                        output.push({
                            name: symbol.name,
                            filepath: path.relative(
                                path.join(configPath, "ts", "generated"),
                                sourceFile.fileName,
                            ),
                        });
                    }
                }
            }
        }
    }

    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, (node) => {
                visit(node, sourceFile);
            });
        }
    }

    const imports = output.map((object) => {
        const filePath = object.filepath.replace(".ts", ".js");

        return `import { ${object.name} } from "${filePath}";`;
    });

    const entries = output.map((object) => {
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

function nodeHasModifier(node: ts.Node, modifier: ts.ModifierFlags): boolean {
    return (
        (ts.getCombinedModifierFlags(node as ts.Declaration) & modifier) !== 0
    );
}

/** True if this is visible outside this file, false otherwise */
function isNodeExported(node: ts.Node): boolean {
    return (
        nodeHasModifier(node, ts.ModifierFlags.Export) ||
        (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
}

makeList();
