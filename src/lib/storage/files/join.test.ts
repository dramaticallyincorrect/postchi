import { describe, expect, it } from "vitest";
import { pathOf } from "./join";
import { join } from "node:path";


describe('pathOf', () => {


    it('joins parts using platform separator', () => {
        const items = ['a', 'b', 'c']
        const joined = pathOf(...items)
        expect(joined).toBe(join(...items))
    })

    it('removes trailing slashes', () => {
        const items = ['a/', 'b', 'c']
        const joined = pathOf(...items)
        expect(joined).toBe(join(...items))
    })
})