import { Collection, CollectionDefinition, HeaderDefinition, Item, ItemGroup, Request, RequestAuthDefinition } from 'postman-collection';

export function convertPostmanCollectionToPostchi(definition: CollectionDefinition): ImportedFolder {

    const collection = new Collection(definition);

    return convertCollectionToFolder(collection);

}

function convertCollectionToFolder(collection: ItemGroup<Item>) {
    return {
        name: collection.name,
        items: collection.items.map((item) => {
            if (item instanceof Item) {
                return convertItemToRequest(item, collection.auth);
            }
            else if (item instanceof ItemGroup) {
                return convertCollectionToFolder(item);
            }
        })
    }
}

function convertItemToRequest(item: Item, inheritedAuth: RequestAuthDefinition | undefined = undefined): ImportedRequest {

    return {
        name: item.name,
        request: convertPostmanRequest(item.request, inheritedAuth)
    }
}

export function convertPostmanRequest(request: Request, inheritedAuth: RequestAuthDefinition | undefined = undefined): string {
    const method = request.method;
    const url = transformVariables(request.url.toString());
    const auth = request.auth as RequestAuthDefinition | undefined;

    const headers: HeaderDefinition[] = request.headers.map(header => ({ key: header.key, value: transformVariables(header.value) }));

    const authValue = getAuthValue(auth || inheritedAuth);

    if (authValue) {
        headers.push({ key: 'Authorization', value: authValue });
    }

    const headersString = headers.length === 0 ? '' : headers.map(header => `${header.key}: ${header.value}`).join('\n');

    let bodyString = '';
    switch (request.body?.mode) {
        case 'urlencoded':
            bodyString = request.body.urlencoded?.map(param => `${param.key}=${transformVariables(param.value)}`).join('\n') || '';
            break;
        case 'formdata':
            bodyString = request.body.formdata?.map(param => {
                let value = transformVariables(param.value);
                if ('src' in param && param.src) {
                    value = `readFile(${param.src})`;
                }
                return `${param.key}=${value}`;
            }).join('\n') || '';
            break;
        case 'raw':
            bodyString = request.body.raw || '';
            break;
        case 'file':
            bodyString = `readFile(${request.body.file?.src || ''})`;
            break;
    }

    const urlSeparator = headersString || bodyString ? '\n' : '';
    const bodySeparator = headersString && bodyString ? '\n' : '';

    return `${method} ${url}${urlSeparator}${headersString}${bodySeparator}${bodyString ? `@body\n${bodyString}` : ''}`.trim();
}

function transformVariables(text: string | null): string {
    // resolve all {{variables}} in the url to <variables>
    if (!text) return '';
    return text.replace(/{{(.*?)}}/g, '<$1>');
}

function getAuthValue(auth: RequestAuthDefinition | undefined): string | undefined {
    let authValue: string | undefined = undefined;
    if (auth) {
        switch (auth.type) {
            case 'basic':
                const username = auth.basic?.find(param => param.key === 'username')?.value || '';
                const password = auth.basic?.find(param => param.key === 'password')?.value || '';
                authValue = `basic(${transformVariables(username)},${transformVariables(password)})`;
                break
            case 'bearer':
                const token = auth.bearer?.find(param => param.key === 'token')?.value || '';
                if (token.startsWith('{{') && token.endsWith('}}')) {
                    authValue = `bearer(${transformVariables(token)})`;
                } else {
                    authValue = `bearer(${token})`;
                }
                break
        }
    }
    return authValue;
}


export type ImportedFolder = {
    name: string;
    items: (ImportedFolder | ImportedRequest)[];
}

export type ImportedRequest = {
    name: string;
    request: string;
}