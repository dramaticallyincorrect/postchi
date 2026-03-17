import { expect, test } from "vitest";
import httpFunctions from "./http-functions";
import DefaultFileStorage from "@/lib/data/files/file-default";

test('bearer', async () => {
    const token = 'my-secret-token'
    const expected = `Bearer ${token}`
    const result = await httpFunctions.get('bearer')?.execute([token])
    expect(result).toBe(expected)
})

test('readText', async () => {
    const fileStorage = DefaultFileStorage.getInstance()
    const path = '/test'
    const expected = 'Hello, world!'
    await fileStorage.writeText(path, expected)
    const result = await httpFunctions.get('readText')?.execute([path])
    expect(result).toBe(expected)
})

test('basicAuth', async () => {
    const username = 'postchi'
    const password = 'abc123'
    const expected = 'Basic cG9zdGNoaTphYmMxMjM='
    const result = await httpFunctions.get('basicAuth')?.execute([username, password])
    expect(result).toBe(expected)
})

test('join', async () => {
    const expected = 'abc'
    const result = await httpFunctions.get('join')?.execute(['a', 'b', 'c'])
    expect(result).toBe(expected)
})