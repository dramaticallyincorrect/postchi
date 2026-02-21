import { testTree } from "@lezer/generator/test";
import { test } from "vitest";
import { parser } from "./parser";



test("environment is defined", () => {

    const env = '# production'

    const spec = `Environments(
    Environment(Pound,EnvironmentName()))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});

test("environment with variables", () => {

    const env = `
# production
VAR1=value1
VAR2=value2
`

    const spec = `Environments(
    Environment(Pound,EnvironmentName, Entry(Key, Value), Entry(Key, Value)))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});

test("values with double slash", () => {

    const env = `
# production
VAR1= http://example.com
VAR2=value2
`

    const spec = `Environments(
    Environment(Pound,EnvironmentName, Entry(Key, Value), Entry(Key, Value)))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});

test("multiple environments with variables", () => {

    const env = `
# production
VAR1=value1
VAR2=value2
# development
`

    const spec = `Environments(
    Environment(Pound,EnvironmentName, Entry(Key, Value), Entry(Key, Value)),
    Environment(Pound,EnvironmentName,))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});

test("multiple empty environments", () => {

    const env = `
# production

# development
`

    const spec = `Environments(
    Environment(Pound,EnvironmentName,),
    Environment(Pound,EnvironmentName,))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});


test("comments", () => {

    const env = `
// # production
// var1=value1
# development
`

    const spec = `Environments(
    Comment,
    Comment,
    Environment(Pound,EnvironmentName))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});


test("no environments at the start", () => {

    const env = `

VAR1=value1
VAR2=value2
# development
# prod
`

    const spec = `Environments(
    Entry(Key, Value),
    Entry(Key, Value),
    Environment(Pound,EnvironmentName,),
    Environment(Pound,EnvironmentName,))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});

test("entry has no value", () => {

    const env = `
# development
VAR1=
sd
# development
`
    const spec = `Environments(
    Environment(Pound,EnvironmentName,Entry(Key),Entry(Key)),
    Environment(Pound,EnvironmentName))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});

test("entry has no key", () => {

    const env = `
# development
= VAR
# development
`
    const spec = `Environments(
    Environment(Pound,EnvironmentName,Entry(Value)),
    Environment(Pound,EnvironmentName))`

    const tree = parser.parse(env)
    testTree(tree, spec)

});
