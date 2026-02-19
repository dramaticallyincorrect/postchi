import { expect, test } from "vitest";
import { parser } from "../parser/parser";
import { computeEnvironmentDiagnostics, EnvironmentLint, errorDiagnostic } from "./environments-linter";
import printTree from "@/lib/lezer-test-utils";

test("variables have no associated environment", () => {

    const env = `
VAR1=value1
VAR2=value2
# production
`.trim();

    const tree = parser.parse(env)

    const errors = computeEnvironmentDiagnostics(tree, env)

    expect(errors).toStrictEqual([
        errorDiagnostic(EnvironmentLint.NoEnvironmentDefined, 0, 0),
    ])

})

test("variables has no key", () => {

    const env = `
# production
 =VAR2
# development
`.trim();

    const tree = parser.parse(env)

    const errors = computeEnvironmentDiagnostics(tree, env)

    printTree(tree, env)
    const index = env.indexOf("=");

    expect(errors).toStrictEqual([
        errorDiagnostic(EnvironmentLint.MissingKey, index, index),
    ])

})


test("variables has no value", () => {

    const env = `
# production
VAR2
# development
`.trim();

    const tree = parser.parse(env)


    const errors = computeEnvironmentDiagnostics(tree, env)


    const index = env.indexOf("VAR2") + 4;

    expect(errors).toStrictEqual([
        errorDiagnostic(EnvironmentLint.MissingValue, index, index),
    ])

})


test("variables has no value", () => {

    const env = `
# production
VAR2=
# development
`.trim();

    const tree = parser.parse(env)


    const errors = computeEnvironmentDiagnostics(tree, env)


    const index = env.indexOf("=") + 1;

    expect(errors).toStrictEqual([
        errorDiagnostic(EnvironmentLint.MissingValue, index, index),
    ])

})