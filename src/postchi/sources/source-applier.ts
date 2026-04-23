import DefaultFileStorage from '@/lib/storage/files/file-default'
import { AuthMethod, FolderSettings, patchFolderSettings, readFolderSettings, SecurityRequirement } from '../project/project'
import { PendingSourceChanges, SOURCE_SPEC_FILENAME } from './source-checker'
import * as yaml from 'js-yaml'
import { pathOf } from '@/lib/storage/files/join'
import { extractGlobalSecurity } from '../import/open-api/open-api-parser'
import { REQUEST_SPEC_FILENAME_SUFFIX } from './request-spec'
import { FileType } from '../project/file-types/supported-filetypes'

export async function applySourceChanges(
    pending: PendingSourceChanges[],
    fileStorage = DefaultFileStorage.getInstance()
): Promise<void> {
    for (const { source, changes, remoteDoc } of pending) {
        for (const change of changes) {
            switch (change.kind) {
                case 'added': {
                    const parentDir = change.path.substring(0, change.path.lastIndexOf('/'))
                    await fileStorage.mkdir(parentDir)
                    await fileStorage.create(change.path, change.newContent ?? '')
                    if (change.spec) {
                        const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                        await fileStorage.create(specFilePath, yaml.dump(change.spec))
                    }
                    break
                }
                case 'removed': {
                    await fileStorage.delete(change.path)
                    const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                    try { await fileStorage.delete(specFilePath) } catch { /* spec file may not exist */ }
                    break
                }
                case 'modified': {
                    await fileStorage.writeText(change.path, change.newContent ?? '')
                    if (change.spec) {
                        const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                        await fileStorage.writeText(specFilePath, yaml.dump(change.spec))
                    }
                    break
                }
                case 'spec': {
                    const specFilePath = change.path.replace(new RegExp(`\\${FileType.HTTP}$`), REQUEST_SPEC_FILENAME_SUFFIX)
                    await fileStorage.writeText(specFilePath, yaml.dump(change.spec))
                }
            }
        }

        const specPath = pathOf(source.absolutePath, SOURCE_SPEC_FILENAME)
        await fileStorage.writeText(specPath, yaml.dump(remoteDoc))

        const existing = await readFolderSettings(source.absolutePath).catch((_) => {
            return {} as FolderSettings
        })

        const security = extractGlobalSecurity(remoteDoc)

        if (security) {
            await patchFolderSettings(source.absolutePath, { security: mergeSecurityRequirements(existing.security || [], security,) }, fileStorage)
        }
    }
}


function mergeSecurityRequirements(
    base: SecurityRequirement[],
    override: SecurityRequirement[]
): SecurityRequirement[] {
    const registry = new Map<string, AuthMethod>();

    base.forEach((req) => {
        Object.entries(req).forEach(([key, method]) => {
            registry.set(key, method);
        });
    });

    override.forEach((req) => {
        Object.entries(req).forEach(([key, newMethod]) => {
            const existingMethod = registry.get(key);


            if (existingMethod && isSameSchema(existingMethod, newMethod)) {
                if (existingMethod.type == 'http' && existingMethod.scheme == 'bearer') {
                    registry.set(key, { ...newMethod, tokenVariable: existingMethod.tokenVariable } as AuthMethod);
                } else if (existingMethod.type == 'http' && existingMethod.scheme == 'basic') {
                    registry.set(key, { ...newMethod, usernameVariable: existingMethod.usernameVariable, passwordVariable: existingMethod.passwordVariable } as AuthMethod);
                } else if (existingMethod.type == 'apiKey') {
                    registry.set(key, { ...newMethod, keyVariable: existingMethod.keyVariable } as AuthMethod);
                }
            } else {
                registry.set(key, newMethod);
            }
        });
    });

    
    return Array.from(registry.entries()).map(([key, method]) => ({
        [key]: method,
    }));
}

function isSameSchema(a: AuthMethod, b: AuthMethod): boolean {
    if (a.type !== b.type) return false;

    if (a.type === 'http' && b.type === 'http') {
        return a.scheme === b.scheme;
    }

    return true;
}