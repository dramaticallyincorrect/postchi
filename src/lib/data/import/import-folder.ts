import { convertPostmanCollectionToPostchi, ImportedFolder, ImportedRequest } from "./postman/postman-parser";
import { pathOf } from "../files/join";
import { createHttpRequest, createProjectFolder } from "../project/project";

// TODO: handle import failure
export async function importPostmanCollection(file: File, root: string): Promise<ImportResult> {
    const content = await file.text();
    const postmanData = JSON.parse(content);
    const rootFolder = convertPostmanCollectionToPostchi(postmanData);
    return importFolderInto(rootFolder, root);
}

export async function importFolderInto(folder: ImportedFolder, root: string): Promise<ImportResult> {
    const folderPath = pathOf(root, folder.name);
    await createProjectFolder(folderPath);

    let result: ImportResult = { count: 0, skipped: 0 };

    for (const item of folder.items) {
        if ('request' in item) {
            const request = item as ImportedRequest;
            try {
                await createHttpRequest(folderPath, request.name, request.request);
                result.count++;
            } catch (e) {
                console.error(`Failed to import request ${request.name}:`, e);
                result.skipped++;
            }
        } else {
            const subResult = await importFolderInto(item as ImportedFolder, folderPath);
            result.count += subResult.count;
            result.skipped += subResult.skipped;
        }
    }
    return result;
}

export type ImportResult = {
    count: number;
    skipped: number;
}
