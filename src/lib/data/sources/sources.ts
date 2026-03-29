import DefaultFileStorage from "../files/file-default"
import { FileStorage } from "../files/file"
import { pathOf } from "../files/join"
import { postchiDirName, sourcesFileName } from "../project/project"

export type SourceType = 'open-api';

export type SourceAuthType = 'gitlab-pat';

export type Source = {
    type: SourceType;
    url: string;
    /** Path of the folder that holds this source's requests, relative to the collections folder */
    path: string;
    /** Auth type required to fetch this source. Token is stored separately in the credential store. */
    authType?: SourceAuthType;
};

export type SourcesConfig = {
    sources: Source[];
};

function sourcesFilePath(projectPath: string): string {
    return pathOf(projectPath, postchiDirName, sourcesFileName)
}

export async function readSources(projectPath: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<SourcesConfig> {
    const content = await fileStorage.readText(sourcesFilePath(projectPath))
    return JSON.parse(content) as SourcesConfig
}

export async function writeSources(projectPath: string, config: SourcesConfig, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    await fileStorage.writeText(sourcesFilePath(projectPath), JSON.stringify(config, null, 2))
}

export async function addSource(projectPath: string, source: Source, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    const config = await readSources(projectPath, fileStorage)
    config.sources.push(source)
    await writeSources(projectPath, config, fileStorage)
}
