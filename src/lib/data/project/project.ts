import { FileStorage } from "../files/file"
import DefaultFileStorage from "../files/file-default"
import { pathOf } from "../files/join"
import { FileType } from "../supported-filetypes"

export type Project = {
    name: string
    path: string
    envPath: string
    secretsPath: string
    collectionsPath: string
}

export async function createProject(path: string, name: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<Project> {
    await fileStorage.mkdir(path)
    await fileStorage.mkdir(pathOf(path, collectionsDirName))
    await fileStorage.mkdir(pathOf(path, collectionsDirName, 'top', 'nested', 'deep', 'down'))
    await fileStorage.create(pathOf(path, collectionsDirName, 'users.get'), `POST https://httpbin.org/post
User-Agent: <user-agent>
Accept: application/json
Authorization: bearer(<token>)
@body
{
  "username": "<username>"
}`)
    await fileStorage.create(pathOf(path, collectionsDirName, 'auth.get'), 'GET https://httpbin.org/get')
    await fileStorage.create(pathOf(path, environmentsName + envExtension), '# production \n token=1231sdfls\n\n# staging')
    await fileStorage.create(pathOf(path, secretsName + envExtension))
    return {
        name,
        path,
        envPath: pathOf(path, environmentsName + envExtension),
        secretsPath: pathOf(path, secretsName + envExtension),
        collectionsPath: pathOf(path, collectionsDirName)
    };
}

export async function createProjectFolder(path: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<void> {
    return fileStorage.mkdir(path)
}

export async function createHttpRequest(dir: string, name: string, content?: string, fileStorage: FileStorage = DefaultFileStorage.getInstance()): Promise<string> {
    const filename = name.endsWith(FileType.HTTP) ? name : name + FileType.HTTP
    const path = pathOf(dir, filename)
    await fileStorage.create(path, content)
    return path
}

const collectionsDirName = "collections"
const environmentsName = "environments"
const secretsName = "secrets"
const envExtension = '.cenv'