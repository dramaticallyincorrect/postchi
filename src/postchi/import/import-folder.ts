import { convertPostmanCollectionToPostchi, ImportedFolder, ImportedRequest } from "./postman/postman-parser";
import { convertDocumentToFolder, fetchOpenApiSpec, fetchOpenApiSpecFromFile } from "./open-api/open-api-parser";
import { createHttpRequest, createProjectFolder, sanitizeFilename } from "../project/project";
import { OpenAPIV3 } from "openapi-types";
import { pathOf } from "@/lib/storage/files/join";
import { REQUEST_SPEC_FILENAME_SUFFIX } from "../sources/request-spec";
import DefaultFileStorage from "@/lib/storage/files/file-default";
import * as yaml from 'js-yaml';

// TODO: handle import failure
export async function importPostmanCollection(file: File, root: string): Promise<ImportResult> {
    const content = await file.text();
    const postmanData = JSON.parse(content);
    const rootFolder = convertPostmanCollectionToPostchi(postmanData);
    return importFolderInto(rootFolder, root);
}

export async function importOpenApiFromFile(file: File, root: string): Promise<ImportOpenApiResult> {
    const doc = await fetchOpenApiSpecFromFile(file);
    const rootFolder = convertDocumentToFolder(doc);
    const result = await importFolderInto(rootFolder, root);
    return { ...result, specYaml: yaml.dump(doc), servers: doc.servers ?? [] };
}

export async function importAutoFromFile(file: File, root: string): Promise<ImportResult | ImportOpenApiResult> {
    const content = await file.text();
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        // Not JSON — must be YAML OpenAPI
        return importOpenApiFromFile(file, root);
    }
    // Detect Postman by schema field
    const schema = (parsed as Record<string, unknown> & { info?: { schema?: unknown } })?.info?.schema ?? '';
    if (typeof schema === 'string' && schema.includes('postman')) {
        return importPostmanCollection(file, root);
    }
    return importOpenApiFromFile(file, root);
}

export async function importOpenApiFromUrl(url: string, root: string, token?: string): Promise<ImportOpenApiResult> {
    console.log(`Fetching OpenAPI spec from ${url}...`);
    const doc = await fetchOpenApiSpec(url, token);
    if (doc.isErr) throw Error(doc.error.message)
    const rootFolder = convertDocumentToFolder(doc.value);
    const result = await importFolderInto(rootFolder, root);
    return { ...result, specYaml: yaml.dump(doc.value), servers: doc.value.servers ?? [] };
}

export type ImportOpenApiResult = ImportResult & {
    specYaml: string;
    servers: OpenAPIV3.ServerObject[];
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
                if (request.spec) {
                    const specFilename = sanitizeFilename(request.name) + REQUEST_SPEC_FILENAME_SUFFIX
                    await DefaultFileStorage.getInstance().create(pathOf(folderPath, specFilename), yaml.dump(request.spec))
                }
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
