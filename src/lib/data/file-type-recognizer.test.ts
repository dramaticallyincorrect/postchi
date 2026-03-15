import { describe, expect, it } from "vitest";
import { FileType } from "./supported-filetypes";
import { getFileTypeFromPath } from "./file-type-recognizer";

describe('get type of file from path', () => {
    it('http', () => {
        const path = '/test/test.get'

        expect(getFileTypeFromPath(path)).toBe(FileType.HTTP)

    })

    it('environment', () => {
        const path = '/test/test.cenv'

        expect(getFileTypeFromPath(path)).toBe(FileType.ENVIRONMENT)

    })


    it('before script', () => {
        const path = '/test/login.before.js'
        expect(getFileTypeFromPath(path)).toBe(FileType.BEFORE_SCRIPT)
    })

    it('unknown is undefined', () => {
        const path = '/test/test.unknown'

        expect(getFileTypeFromPath(path)).toBeUndefined()

    })
})