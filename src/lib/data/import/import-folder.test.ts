import { beforeEach, describe, expect, it } from "vitest";
import { ImportedFolder } from "./postman/postman-parser";
import { parseFileTree } from "@/lib/utils/test-utils";
import { fs } from "memfs";
import { readFileTree } from "../project-files";
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

        await importFolderInto(folder, root)

        const actual = await readFileTree(root)

        expect(actual).toEqual(expectedFileTree)

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

        await importPostmanCollection(new File([JSON.stringify(postmanData.toJSON())], 'postman.json'), root)

        const actual = await readFileTree(root)

        const expectedFileTree = parseFileTree(expected, root)
        expect(actual).toEqual(expectedFileTree)
    })
})