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
    const url = request.url.toString();
    const auth = request.auth as RequestAuthDefinition | undefined;

    const headers: HeaderDefinition[] = request.headers.map(header => ({ key: header.key, value: header.value }));

    const authValue = getAuthValue(auth || inheritedAuth);

    if (authValue) {
        headers.push({ key: 'Authorization', value: authValue });
    }

    const headersString = headers.length === 0 ? '' : headers.map(header => `${header.key}: ${header.value}`).join('\n');

    let bodyString = '';
    switch (request.body?.mode) {
        case 'urlencoded':
            bodyString = request.body.urlencoded?.map(param => `${param.key}=${param.value}`).join('\n') || '';
            break;
    }

    const urlSeparator = headersString || bodyString ? '\n' : '';

    return `${method} ${url}${urlSeparator}${headersString}${bodyString ? `@body\n${bodyString}` : ''}`.trim();
}

function getAuthValue(auth: RequestAuthDefinition | undefined): string | undefined {
    let authValue: string | undefined = undefined;
    if (auth) {
        switch (auth.type) {
            case 'basic':
                const username = auth.basic?.find(param => param.key === 'username')?.value || '';
                const password = auth.basic?.find(param => param.key === 'password')?.value || '';
                authValue = `basic(${username},${password})`;
                break
            case 'bearer':
                const token = auth.bearer?.find(param => param.key === 'token')?.value || '';
                if (token.startsWith('{{') && token.endsWith('}}')) {
                    authValue = `bearer(<${token.slice(2, -2)}>)`;
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