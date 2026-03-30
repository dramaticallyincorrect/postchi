import { beforeEach, describe, expect, it } from "vitest";
import { ImportedFolder } from "./postman/postman-parser";
import { parseFileTree } from "@/lib/utils/test-utils";
import { fs } from "memfs";
import { importFolderInto, importPostmanCollection } from "./import-folder";
import { Item, ItemGroup } from "postman-collection";

const root = '/test-project'

const folder: ImportedFolder = {
    name: 'Root Folder',
    items: [
        {
            name: 'Request 1',
            request: "GET http://example.com"
        },
        {
            name: 'Sub Folder',
            items: [
                {
                    name: 'Request 2',
                    request: "POST http://example.com"
                }
            ]
        }
    ]
}

const expected = `
    Root Folder
        Request 1.get
        Sub Folder
            Request 2.get
    `


describe('import', () => {
    beforeEach(() => {
        fs.rmSync(root, { recursive: true, force: true })
        fs.mkdirSync(root)
    })

    it('imports a imported folder into project along all its nested files', async () => {


        const expectedFileTree = parseFileTree(expected, root)

        const importResult = await importFolderInto(folder, root)

        expect(expectedFileTree.every(entry => fs.existsSync(entry.path))).toBe(true)
        expect(importResult).toEqual({ count: 2, skipped: 0 })

    })

    it('reads the postman file and imports its', async () => {
        const postmanData: ItemGroup<Item> = new ItemGroup({
            "name": "Root Folder",
            "item": [
                {
                    "name": "Request 1",
                    "request": {
                        "method": "GET",
                        "url": {
                            "protocol": "http",
                            "host": ["example", "com"]
                        }
                    }
                },
                {
                    "name": "Sub Folder",
                    "item": [
                        {
                            "name": "Request 2",
                            "request": {
                                "method": "POST",
                                "url": {
                                    "protocol": "http",
                                    "host": ["example", "com"]
                                }
                            }
                        }
                    ]
                }
            ]
        })

        const importResult = await importPostmanCollection(new File([JSON.stringify(postmanData.toJSON())], 'postman.json'), root)
        expect(importResult).toEqual({ count: 2, skipped: 0 })


        const expectedFileTree = parseFileTree(expected, root)
        expect(expectedFileTree.every(entry => fs.existsSync(entry.path))).toBe(true)
    })
})