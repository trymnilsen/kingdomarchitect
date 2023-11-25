import * as fs from "fs";
import ts from "typescript";
import * as path from "path";
import { OutputObject } from "./outputObject.js";

export function getClasses(
    program: ts.Program,
    basePath: string,
    baseClassName: string,
): OutputObject[] {
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
                    if (baseType == baseClassName) {
                        output.push({
                            name: symbol.name,
                            filepath: path.relative(
                                path.join(basePath, "ts", "generated"),
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

    return output.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }

        return 0;
    });
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
