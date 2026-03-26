import { describe, it, expect } from 'vitest';
import { convertPostmanCollectionToPostchi, convertPostmanRequest, ImportedFolder } from "./postman-parser";
import { CollectionDefinition, ItemDefinition, RequestAuthDefinition, RequestBodyDefinition, RequestDefinition, Request as PRequest } from "postman-collection";


const expectedUrl = 'http://127.0.0.1:8000/chat/gen-ai-student-response?term=searchTerm';
const url = {
    protocol: "http",
    host: ["127", "0", "0", "1"],
    port: "8000",
    path: ["chat", "gen-ai-student-response"],
    query: [
        { key: 'term', value: 'searchTerm' },
    ]
}

describe('request -> postchi request', () => {
    for (const { name, request, expected } of requestTestCases) {
        it(name, () => {
            const actual = convertPostmanRequest(new PRequest(request));
            expect(actual).toStrictEqual(expected);
        })
    }

    it('direct auth overrides inherited auth', () => {
        const request: RequestDefinition = {
            method: "POST",
            url: url,
            auth: {
                type: 'bearer',
                bearer: [
                    { key: 'token', value: 'thisimytoken', type: 'string' }
                ]
            }
        }

        const inheritedAuth: RequestAuthDefinition = {
            type: 'basic',
            basic: [
                { key: 'username', value: 'user' },
                { key: 'password', value: 'pass' }
            ]
        }
        const actual = convertPostmanRequest(new PRequest(request), inheritedAuth);
        expect(actual).toStrictEqual(`POST ${expectedUrl}\nAuthorization: bearer(thisimytoken)`);
    })

    describe('variables are transformed to postchi syntax', () => {

        const exampleUrl = 'http://example.com:8000';
        const url = {
            protocol: "http",
            "host": [
                "example",
                "com"
            ],
            port: "8000",
        }

        const varients = [
            {
                name: 'url',
                request: {
                    method: "POST",
                    url: {
                        protocol: "http",
                        "host": [
                            "example",
                            "com{{base_url}}"
                        ],
                        port: "8000",
                    },
                },
                expected: `POST http://example.com<base_url>:8000`
            },
            {
                name: 'query parameter',
                request: {
                    method: "POST",
                    url: {
                        protocol: "http",
                        "host": [
                            "example",
                            "com"
                        ],
                        port: "8000",
                        query: [
                            { key: 'search', value: '{{searchTerm}}' }
                        ]
                    },
                },
                expected: `POST ${exampleUrl}?search=<searchTerm>`
            },
            {
                name: 'header',
                request: {
                    method: "POST",
                    url: url,
                    header: [
                        { key: 'X-API-Key', value: '{{apiKey}}' }
                    ]
                },
                expected: `POST ${exampleUrl}\nX-API-Key: <apiKey>`
            },
            {
                name: 'header',
                request: {
                    method: "POST",
                    url: url,
                    header: [
                        { key: 'X-API-Key', value: '{{apiKey}}' }
                    ]
                },
                expected: `POST ${exampleUrl}\nX-API-Key: <apiKey>`
            },
            {
                name: 'body - urlencoded',
                request: {
                    method: "POST",
                    url: url,
                    body: {
                        mode: 'raw',
                        raw: JSON.stringify({
                            key1: 'value1',
                            key2: '{{value2}}'
                        })
                    }
                },
                expected: `POST ${exampleUrl}\n@body\n{"key1":"value1","key2":"<value2>"}`
            },
            {
                name: 'body - urlencoded',
                request: {
                    method: "POST",
                    url: url,
                    body: {
                        mode: 'urlencoded',
                        urlencoded: [
                            { key: 'key1', value: 'value1' },
                            { key: 'key2', value: '{{value2}}' }
                        ]
                    }
                },
                expected: `POST ${exampleUrl}\n@body\nkey1=value1\nkey2=<value2>`
            },
            {
                name: 'body - form',
                request: {
                    method: "POST",
                    url: url,
                    body: {
                        mode: 'formdata',
                        formdata: [
                            { key: 'key1', value: 'value1', },
                            { key: 'key2', value: '{{value2}}', }
                        ]
                    }
                },
                expected: `POST ${exampleUrl}\n@body\nkey1=value1\nkey2=<value2>`
            },
            {
                name: 'auth - basic',
                request: {
                    method: "POST",
                    url: url,
                    auth: {
                        type: 'basic',
                        basic: [
                            { key: 'username', value: '{{username}}' },
                            { key: 'password', value: '{{password}}' }
                        ]
                    } as RequestAuthDefinition
                },
                expected: `POST ${exampleUrl}\nAuthorization: basic(<username>,<password>)`
            },
            {
                name: 'auth - bearer',
                request: {
                    method: "POST",
                    url: url,
                    auth: {
                        type: 'bearer',
                        bearer: [
                            { key: 'token', value: '{{token}}', type: 'string' }
                        ]
                    } as RequestAuthDefinition
                },
                expected: `POST ${exampleUrl}\nAuthorization: bearer(<token>)`
            },
        ]

        it.each(varients)('$name', ({ request, expected }) => {
            const actual = convertPostmanRequest(new PRequest(request));
            expect(actual).toStrictEqual(expected);
        })


    })


})

describe('import postman collection', () => {
    const makeNested = (input: CollectionDefinition, output: ImportedFolder): [CollectionDefinition, ImportedFolder] => {
        const nested = collectionOf(input)
        const nestedExpected = {
            name: 'test collection',
            items: [
                output
            ]
        }
        return [nested, nestedExpected]
    }

    describe('flat', () => {
        runCollectionTests((input, output) => [input, output])
    })

    describe('nested', () => {
        runCollectionTests(makeNested)
    })


})


const requestTestCases: {
    name: string;
    request: RequestDefinition;
    expected: string;
}[] = [
        {
            name: 'method url',
            request: {
                method: "POST",
                url: url
            },
            expected: `POST ${expectedUrl}`
        },
        {
            name: 'headers',
            request: {
                method: "POST",
                url: url,
                header: [
                    { key: 'Content-Type', value: 'application/json' }
                ]
            },
            expected: `POST ${expectedUrl}\nContent-Type: application/json`
        },
        {
            name: 'auth - basic',
            request: {
                method: "POST",
                url: url,
                auth: {
                    type: 'basic',
                    basic: [
                        { key: 'username', value: 'user' },
                        { key: 'password', value: 'pass' }
                    ]
                }
            },
            expected: `POST ${expectedUrl}\nAuthorization: basic(user,pass)`
        },
        {
            name: 'auth - bearer',
            request: {
                method: "POST",
                url: url,
                auth: {
                    type: 'bearer',
                    bearer: [
                        { key: 'token', value: 'thisimytoken', type: 'string' }
                    ]
                }
            },
            expected: `POST ${expectedUrl}\nAuthorization: bearer(thisimytoken)`
        },
        {
            name: 'body - urlencoded',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'urlencoded',
                    urlencoded: [
                        { key: 'key1', value: 'value1' },
                        { key: 'key2', value: 'value2' }
                    ]
                }
            },
            expected: `POST ${expectedUrl}\n@body\nkey1=value1\nkey2=value2`
        },
        {
            name: 'body - form',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'formdata',
                    formdata: [
                        { key: 'key1', value: 'value1', },
                        { key: 'key2', value: 'value2', }
                    ]
                }
            },
            expected: `POST ${expectedUrl}\n@body\nkey1=value1\nkey2=value2`
        },
        {
            name: 'body - form with file',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'formdata',
                    formdata: [
                        { key: 'key1', value: 'value1', },
                        { key: 'pass', src: '/some/file/path' } as any
                    ]
                }
            },
            expected: `POST ${expectedUrl}\n@body\nkey1=value1\npass=readFile(/some/file/path)`
        },
        {
            name: 'body - json',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'raw',
                    raw: '{"key1": "value1"}',
                }
            },
            expected: `POST ${expectedUrl}\n@body\n{"key1": "value1"}`
        },
        {
            name: 'body - file',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'file',
                    file: {
                        src: '/some/file/path'
                    }
                }
            },
            expected: `POST ${expectedUrl}\n@body\nreadFile(/some/file/path)`
        },
        {
            name: 'request line body',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'raw',
                    raw: '{"key1": "value1"}',
                }
            },
            expected: `POST ${expectedUrl}\n@body\n{"key1": "value1"}`
        },
        {
            name: 'request line auth body',
            request: {
                method: "POST",
                url: url,
                body: {
                    mode: 'raw',
                    raw: '{"key1": "value1"}',
                },
                auth: {
                    type: 'bearer',
                    bearer: [
                        { key: 'token', value: 'thisimytoken', type: 'string' }
                    ]
                }
            },
            expected: `POST ${expectedUrl}\nAuthorization: bearer(thisimytoken)\n@body\n{"key1": "value1"}`
        },
    ]

function runCollectionTests(getInputOutput: (input: CollectionDefinition, output: ImportedFolder) => [CollectionDefinition, ImportedFolder]) {

    it('should transform to folder', () => {
        for (const { name, request, expected } of requestTestCases) {
            const [input, output] = getInputOutput(collectionOf(
                {
                    name: "student-response",
                    request: request
                }
            ), {
                name: 'test collection',
                items: [
                    {
                        name: 'student-response',
                        request: expected
                    }
                ]
            });
            const actual = convertPostmanCollectionToPostchi(input);
            expect.soft(actual, name).toStrictEqual(output);
        }
    })


    describe('auth', () => {

        it('inherited auth is added to the request', () => {
            const [input, output] = getInputOutput(collectionOf(postmanRequest({}, []), {
                type: 'bearer',
                bearer: [
                    { key: 'token', value: 'mytokenvalue', type: 'string' }
                ]
            }), {
                name: 'test collection',
                items: [
                    {
                        name: 'student-response',
                        request: `POST http://127.0.0.1:8000/chat/gen-ai-student-response\nAuthorization: bearer(mytokenvalue)`
                    }
                ]
            });

            expect(convertPostmanCollectionToPostchi(input)).toStrictEqual(output);

        })


        it('closest inherited auth takes precedences over further inherited auths', () => {
            const innerCollection = collectionOf(postmanRequest({}, []), {
                type: 'bearer',
                bearer: [
                    { key: 'token', value: 'tokenValue', type: 'string' }
                ]
            })

            const outerCollection: CollectionDefinition = {
                info: {
                    name: "test collection",
                },
                item: [innerCollection],
                auth: {
                    type: 'bearer',
                    bearer: [
                        { key: 'token', value: 'root token', type: 'string' }
                    ]
                }
            }

            const [input, output] = getInputOutput(outerCollection, {
                name: 'test collection',
                items: [
                    {
                        name: 'test collection',
                        items: [
                            {
                                name: 'student-response',
                                request: `POST http://127.0.0.1:8000/chat/gen-ai-student-response\nAuthorization: bearer(tokenValue)`
                            }
                        ]
                    }
                ]
            });

            expect(convertPostmanCollectionToPostchi(input)).toStrictEqual(output);
        })

    })
}



function collectionOf(items: ItemDefinition | ItemDefinition[], auth: RequestAuthDefinition | undefined = undefined): CollectionDefinition {
    return {
        info: {
            name: "test collection",
        },
        item: Array.isArray(items) ? items : [items],
        auth: auth
    }
}


function postmanRequest(headers: Record<string, string> = {}, query: Record<string, string>[] = [], auth: RequestAuthDefinition | undefined = undefined, body: RequestBodyDefinition | undefined = undefined): ItemDefinition {
    return {
        name: "student-response",
        request: {
            method: "POST",
            url: {
                protocol: "http",
                host: ["127", "0", "0", "1"],
                port: "8000",
                path: ["chat", "gen-ai-student-response"],
                query: query.map(q => ({ key: Object.keys(q)[0], value: Object.values(q)[0] }))
            },
            header: Object.entries(headers).map(([key, value]) => ({ key, value })),
            auth: auth,
            body: body
        },
    };
}