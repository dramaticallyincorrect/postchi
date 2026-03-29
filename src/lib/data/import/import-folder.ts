import { convertPostmanCollectionToPostchi, ImportedFolder, ImportedRequest } from "./postman/postman-parser";
import { convertDocumentToFolder, fetchOpenApiSpec } from "./open-api/open-api-parser";
import { pathOf } from "../files/join";
import { createHttpRequest, createProjectFolder } from "../project/project";

// TODO: handle import failure
export async function importPostmanCollection(file: File, root: string): Promise<ImportResult> {
    const content = await file.text();
    const postmanData = JSON.parse(content);
    const rootFolder = convertPostmanCollectionToPostchi(postmanData);
    return importFolderInto(rootFolder, root);
}

export async function importOpenApiFromUrl(url: string, root: string): Promise<ImportOpenApiResult> {
    console.log(`Fetching OpenAPI spec from ${url}...`);
    const doc = await fetchOpenApiSpec(url);
    const rootFolder = convertDocumentToFolder(doc);
    const result = await importFolderInto(rootFolder, root);
    return { ...result, specJson: JSON.stringify(doc, null, 2) };
}

export type ImportOpenApiResult = ImportResult & {
    specJson: string;
}

export async function importFolderInto(folder: ImportedFolder, root: string): Promise<ImportResult> {
    const folderPath = pathOf(root, folder.name);
    await createProjectFolder(folderPath);

    let result: ImportResult = { count: 0, skippedRequests: [], rootFolderName: folder.name };

    for (const item of folder.items) {
        if ('request' in item) {
            const request = item as ImportedRequest;
            try {
                await createHttpRequest(folderPath, request.name, request.request);
                result.count++;
            } catch (e) {
                console.error(`Failed to import request ${request.name}:`, e);
                result.skippedRequests.push(request.name);
            }
        } else {
            const subResult = await importFolderInto(item as ImportedFolder, folderPath);
            result.count += subResult.count;
            result.skippedRequests.push(...subResult.skippedRequests);
        }
    }
    return result;
}

export type ImportResult = {
    count: number;
    skippedRequests: string[];
    /** Name of the top-level folder created during import, relative to the collections root */
    rootFolderName: string;
}
