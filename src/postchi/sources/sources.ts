import { FileStorage } from "@/lib/storage/files/file";
import DefaultFileStorage from "@/lib/storage/files/file-default";
import { pathOf } from "@/lib/storage/files/join";
import { postchiDirName, projectForPath, sourcesFileName } from "../project/project"
import { getActiveProject } from "@/lib/project-state";

export type SourceType = 'open-api';

export type SourceAuthType = 'gitlab-pat' | 'github-token';

type PeristedSource = Omit<Source, 'absolutePath'>;

export type Source = {
    type: SourceType;
    url: string;
    /** Path of the folder that holds this source's requests, relative to the collections folder */
    path: string;
    absolutePath: string;
    /** Auth type required to fetch this source. Token is stored separately in the credential store. */
    authType?: SourceAuthType;
};

export type PersistedSourcesConfig = {
    sources: PeristedSource[];
};

export type SourcesConfig = {
    sources: Source[];
};

export function sourcesFilePath(projectPath: string): string {
    return pathOf(projectPath, postchiDirName, sourcesFileName)
}

export async function readSources(projectPath: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<SourcesConfig> {
    const content = await fileStorage.readText(sourcesFilePath(projectPath))
    const persisted = JSON.parse(content) as PersistedSourcesConfig
    const configs: Source[] = []
    for (const persitedSource of persisted.sources) {
        configs.push({
            ...persitedSource,
            absolutePath: pathOf(projectForPath(projectPath).collectionsPath, persitedSource.path)
        } as Source)
    }

    return {
        sources: configs
    }
}

export async function writeSources(projectPath: string, config: SourcesConfig, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    const persistedConfigs: PersistedSourcesConfig = {
        sources: config.sources.map((e) => {
            const { absolutePath, ...persisted } = e
            return persisted
        })
    }
    await fileStorage.writeText(sourcesFilePath(projectPath), JSON.stringify(persistedConfigs, null, 2))
}

export async function addSource(projectPath: string, source: Source | PeristedSource, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    const config = await readSources(projectPath, fileStorage)
    config.sources.push({ ...source, absolutePath: '' })
    await writeSources(projectPath, config, fileStorage)
}

export async function deleteSource(sourcePath: string, project = getActiveProject()!, fileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    const config = await readSources(project.path, fileStorage)
    config.sources = config.sources.filter(s => s.path !== sourcePath)
    await writeSources(project.path, config, fileStorage)
    await fileStorage.delete(pathOf(project.collectionsPath, sourcePath)).catch((_) => { })
}
