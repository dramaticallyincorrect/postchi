import { convertPostmanCollectionToPostchi, ImportedFolder, ImportedRequest } from "./postman/postman-parser";
import { pathOf } from "../files/join";
import { createHttpRequest, createProjectFolder } from "../project/project";

export async function importPostmanCollection(file: File, root: string): Promise<void> {
    const content = await file.text();
    const postmanData = JSON.parse(content);
    const rootFolder = convertPostmanCollectionToPostchi(postmanData);
    await importFolderInto(rootFolder, root);
}

export async function importFolderInto(folder: ImportedFolder, root: string): Promise<void> {
    const folderPath = pathOf(root, folder.name);
    await createProjectFolder(folderPath);

    for (const item of folder.items) {
        if ('request' in item) {
            const request = item as ImportedRequest;
            await createHttpRequest(folderPath, request.name, request.request);
        } else {
            await importFolderInto(item as ImportedFolder, folderPath);
        }
    }
}
