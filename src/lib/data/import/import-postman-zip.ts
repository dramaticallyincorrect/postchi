import JSZip from 'jszip';
import { convertPostmanCollectionToPostchi } from './postman/postman-parser';
import { importFolderInto, ImportResult } from './import-folder';

export async function importPostmanZip(file: File, root: string): Promise<ImportResult> {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const collectionFiles = Object.keys(zip.files).filter(
        name => /\/collection\/[^/]+\.json$/.test(name)
    );

    const result: ImportResult = { count: 0, skippedRequests: [] };
    for (const path of collectionFiles) {
        try {
            const content = await zip.files[path].async('string');
            const postmanData = JSON.parse(content);
            const rootFolder = convertPostmanCollectionToPostchi(postmanData);
            const sub = await importFolderInto(rootFolder, root);
            result.count += sub.count;
            result.skippedRequests.push(...sub.skippedRequests);
        }catch (e) {
            console.error(`Failed to import collection at ${path}:`, e);
            result.skippedRequests.push(path);
        }
        
    }
    return result;
}
