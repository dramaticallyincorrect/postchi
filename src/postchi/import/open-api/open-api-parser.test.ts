import { describe, it, expect } from "vitest";
import { convertDocumentToFolder, extractGlobalSecurity, buildRequestSpec } from "./open-api-parser";
import { ImportedFolder, ImportedRequest } from "../postman/postman-parser";
import { OpenAPIV3 } from "openapi-types";

function isFolder(item: ImportedFolder | ImportedRequest): item is ImportedFolder {
  return 'items' in item;
}

function isRequest(item: ImportedFolder | ImportedRequest): item is ImportedRequest {
  return 'request' in item;
}

const ok200 = { '200': { description: 'OK' } }

describe('open api parser', () => {
  it('sets root folder name from info.title', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Swagger Petstore - OpenAPI 3.0', version: '1.0.0' },
      paths: { '/pets': { get: { summary: 'List Pets', responses: ok200 } } },
    });
    expect(result.name).toBe('Swagger Petstore - OpenAPI 3.0');
  });

  it('creates sub-folders for each tag', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet': { get: { tags: ['pet'], summary: 'List pets', responses: ok200 } },
        '/store': { get: { tags: ['store'], summary: 'Store', responses: ok200 } },
        '/user': { get: { tags: ['user'], summary: 'User', responses: ok200 } },
      },
    });
    const folderNames = result.items.filter(isFolder).map(f => f.name);
    expect(folderNames).toContain('pet');
    expect(folderNames).toContain('store');
    expect(folderNames).toContain('user');
  });

  it('uses summary as request name', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet/{petId}': { get: { tags: ['pet'], summary: 'Find pet by ID.', responses: ok200 } },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    expect(petFolder.items.filter(isRequest).map(r => r.name)).toContain('Find pet by ID.');
  });

  it('converts path params {param} to <param>', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet/{petId}': { get: { tags: ['pet'], summary: 'Find pet by ID.', responses: ok200 } },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const getPetById = petFolder.items.find(i => isRequest(i) && i.name === 'Find pet by ID.') as ImportedRequest;
    expect(getPetById.request).toContain('/pet/<petId>');
    expect(getPetById.request).not.toContain('{petId}');
  });

  it('appends query params to URL', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet/findByStatus': {
          get: {
            tags: ['pet'],
            summary: 'Finds Pets by status.',
            parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
            responses: ok200,
          },
        },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const findByStatus = petFolder.items.find(i => isRequest(i) && i.name === 'Finds Pets by status.') as ImportedRequest;
    expect(findByStatus.request).toContain('?status=<status>');
  });

  it('adds Content-Type header and JSON body for application/json requests', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet': {
          post: {
            tags: ['pet'],
            summary: 'Add a new pet to the store.',
            requestBody: {
              content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
            },
            responses: ok200,
          },
        },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const addPet = petFolder.items.find(i => isRequest(i) && i.name === 'Add a new pet to the store.') as ImportedRequest;
    expect(addPet.request).toContain('Content-Type: application/json');
    expect(addPet.request).toContain('@body');
  });

  it('uses example values in JSON skeleton', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet': {
          post: {
            tags: ['pet'],
            summary: 'Add a new pet to the store.',
            requestBody: {
              content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string', example: 'doggie' } } } } },
            },
            responses: ok200,
          },
        },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const addPet = petFolder.items.find(i => isRequest(i) && i.name === 'Add a new pet to the store.') as ImportedRequest;
    expect(addPet.request).toContain('"name": "doggie"');
  });

  it('uses relative URL without prepending server base URL', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      servers: [{ url: '/api/v3' }],
      paths: {
        '/pet': {
          post: {
            tags: ['pet'],
            summary: 'Add a new pet to the store.',
            requestBody: {
              content: { 'application/json': { schema: { type: 'object', properties: {} } } },
            },
            responses: ok200,
          },
        },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const addPet = petFolder.items.find(i => isRequest(i) && i.name === 'Add a new pet to the store.') as ImportedRequest;
    expect(addPet.request).toMatch(/^POST \/pet/);
  });

  it('adds header params as request headers', () => {
    const result = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pet/{petId}': {
          delete: {
            tags: ['pet'],
            summary: 'Deletes a pet.',
            parameters: [{ name: 'api_key', in: 'header', schema: { type: 'string' } }],
            responses: ok200,
          },
        },
      },
    });
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const deletePet = petFolder.items.find(i => isRequest(i) && i.name === 'Deletes a pet.') as ImportedRequest;
    expect(deletePet.request).toContain('api_key: <api_key>');
  });
});

describe('query param value generation', () => {
  it('uses schema.example as the query param value when present', () => {
    const doc = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            summary: 'List Pets',
            parameters: [{ name: 'status', in: 'query', schema: { type: 'string', example: 'available' } }],
            responses: ok200
          }
        }
      }
    })

    const req = doc.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('status=available')
    expect(req.request).not.toContain('status=<status>')
  })

  it('falls back to <name> placeholder when schema.example is absent', () => {
    const doc = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            summary: 'List Pets',
            parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
            responses: ok200
          }
        }
      }
    })

    const req = doc.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('status=<status>')
  })

  describe('prioritizes default value over example', () => {
    it('query', () => {
      const doc = convertDocumentToFolder({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/pets': {
            get: {
              summary: 'List Pets',
              parameters: [{ name: 'status', in: 'query', schema: { type: 'string', default: 'active', example: 'available' } }],
              responses: ok200
            }
          }
        }
      })

      const req = doc.items.find(isRequest) as ImportedRequest
      expect(req.request).toContain('status=active')
    })

    it('header', () => {
      const doc = convertDocumentToFolder({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/pets': {
            get: {
              summary: 'List Pets',
              parameters: [{ name: 'status', in: 'header', schema: { type: 'string', default: 'active', example: 'available' } }],
              responses: ok200
            }
          }
        }
      })

      const req = doc.items.find(isRequest) as ImportedRequest
      expect(req.request).toContain('status: active')
    })
  })

  it('uses schema.example as the query param value when default is absent', () => {
    const doc = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            summary: 'List Pets',
            parameters: [{ name: 'status', in: 'query', schema: { type: 'string', example: 'available' } }],
            responses: ok200
          }
        }
      }
    })

    const req = doc.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('status=available')
  })
})

function makeDoc(overrides: Partial<OpenAPIV3.Document> = {}): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
    ...overrides,
  }
}


describe('extractGlobalSecurity', () => {
  it('returns undefined when there is no security field', () => {
    const doc = makeDoc()
    expect(extractGlobalSecurity(doc)).toBeUndefined()
  })

  it('returns undefined when security array is empty', () => {
    const doc = makeDoc({
      security: [],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
    })
    expect(extractGlobalSecurity(doc)).toBeUndefined()
  })

  it('returns undefined when there are no securitySchemes', () => {
    const doc = makeDoc({ security: [{ bearerAuth: [] }] })
    expect(extractGlobalSecurity(doc)).toBeUndefined()
  })

  it('maps http bearer scheme', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [] }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
    })
    expect(extractGlobalSecurity(doc)).toEqual([
      { bearerAuth: { type: 'http', scheme: 'bearer', tokenVariable: 'BEARERAUTH_TOKEN' } },
    ])
  })

  it('maps http basic scheme', () => {
    const doc = makeDoc({
      security: [{ basicAuth: [] }],
      components: { securitySchemes: { basicAuth: { type: 'http', scheme: 'basic' } } },
    })
    expect(extractGlobalSecurity(doc)).toEqual([
      {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          usernameVariable: 'BASICAUTH_USERNAME',
          passwordVariable: 'BASICAUTH_PASSWORD',
        },
      },
    ])
  })

  it('maps apiKey scheme with header placement', () => {
    const doc = makeDoc({
      security: [{ apiKey: [] }],
      components: { securitySchemes: { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' } } },
    })
    expect(extractGlobalSecurity(doc)).toEqual([
      { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header', keyVariable: 'APIKEY_KEY' } },
    ])
  })

  it('skips oauth2 schemes (not supported yet)', () => {
    const doc = makeDoc({
      security: [{ oauth2: [] }],
      components: {
        securitySchemes: {
          oauth2: { type: 'oauth2', flows: {} },
        },
      },
    })
    expect(extractGlobalSecurity(doc)).toBeUndefined()
  })

  it('returns undefined when all schemes in all requirements are unsupported', () => {
    const doc = makeDoc({
      security: [{ oauth2: [] }, { oauth2: [] }],
      components: { securitySchemes: { oauth2: { type: 'oauth2', flows: {} } } },
    })
    expect(extractGlobalSecurity(doc)).toBeUndefined()
  })

  it('supports OR: multiple requirements each become a separate SecurityRequirement', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [] }, { apiKey: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
          apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
        },
      },
    })
    const result = extractGlobalSecurity(doc)
    expect(result).toHaveLength(2)
    expect(result![0]).toHaveProperty('bearerAuth')
    expect(result![1]).toHaveProperty('apiKey')
  })

  it('supports AND: multiple schemes within one requirement become keys in the same SecurityRequirement', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [], apiKey: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
          apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
        },
      },
    })
    const result = extractGlobalSecurity(doc)
    expect(result).toHaveLength(1)
    expect(result![0]).toHaveProperty('bearerAuth')
    expect(result![0]).toHaveProperty('apiKey')
  })

  it('skips unsupported schemes but keeps supported ones in the same requirement', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [], oauth2: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
          oauth2: { type: 'oauth2', flows: {} },
        },
      },
    })
    const result = extractGlobalSecurity(doc)
    expect(result).toHaveLength(1)
    expect(result![0]).toHaveProperty('bearerAuth')
    expect(result![0]).not.toHaveProperty('oauth2')
  })

  it('returns undefined for a doc with no security field', () => {
    expect(extractGlobalSecurity(makeDoc())).toBeUndefined()
  })
})

describe('buildRequestSpec', () => {
  it('includes method and path', () => {
    const operation: OpenAPIV3.OperationObject = { responses: ok200 }
    const spec = buildRequestSpec('get', '/pets', operation)
    expect(spec.method).toBe('get')
    expect(spec.path).toBe('/pets')
  })

  it('uses the default value of the spec if available', () => {
    const operation: OpenAPIV3.OperationObject = { responses: ok200 }
    const spec = buildRequestSpec('post', '/api/users', operation)
    expect(spec.method).toBe('post')
    expect(spec.path).toBe('/api/users')
    expect(spec.operation).toBeDefined()
  })

  it('omits security when the operation does not explicitly set it', () => {
    const operation: OpenAPIV3.OperationObject = { responses: ok200 }
    const spec = buildRequestSpec('get', '/pets', operation)
    expect('security' in spec.operation).toBe(false)
  })

  it('preserves security when explicitly set to a non-empty array (operation override)', () => {
    const operation: OpenAPIV3.OperationObject = {
      security: [{ apiKey: [] }],
      responses: ok200,
    }
    const spec = buildRequestSpec('get', '/pets', operation)
    expect(spec.operation.security).toEqual([{ apiKey: [] }])
  })

  it('preserves security when explicitly set to an empty array (explicit no-auth)', () => {
    const operation: OpenAPIV3.OperationObject = {
      security: [],
      responses: ok200,
    }
    const spec = buildRequestSpec('get', '/public', operation)
    expect(spec.operation.security).toEqual([])
  })

  it('does not mutate the original operation object', () => {
    const operation: OpenAPIV3.OperationObject = { responses: ok200 }
    buildRequestSpec('get', '/pets', operation)
    expect('security' in operation).toBe(false)
  })
})


describe('request spec field on imported requests', () => {
  it('attaches a spec to every imported request', () => {
    const doc = makeDoc({
      paths: {
        '/pets': {
          get: { summary: 'List Pets', responses: ok200 },
        },
      },
    })
    const folder = convertDocumentToFolder(doc)
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.spec).toBeDefined()
    expect(req.spec!.method).toBe('get')
    expect(req.spec!.path).toBe('/pets')
  })

  it('spec.operation.security is absent for operations without explicit security', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [] }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
      paths: {
        '/pets': {
          get: { summary: 'List Pets', responses: ok200 },
          // no operation-level security → inherits doc.security
        },
      },
    })
    const folder = convertDocumentToFolder(doc)
    const req = folder.items.find(isRequest) as ImportedRequest
    expect('security' in req.spec!.operation).toBe(false)
  })

  it('spec.operation.security is present for operations with an explicit override', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
          apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
        },
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List Pets',
            security: [{ apiKey: [] }],  // explicit override
            responses: ok200,
          },
        },
      },
    })
    const folder = convertDocumentToFolder(doc)
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.spec!.operation.security).toEqual([{ apiKey: [] }])
  })

  it('spec.operation.security is an empty array for operations that opt out of auth', () => {
    const doc = makeDoc({
      security: [{ bearerAuth: [] }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
      paths: {
        '/public': {
          get: {
            summary: 'Public endpoint',
            security: [],  // explicit no-auth
            responses: ok200,
          },
        },
      },
    })
    const folder = convertDocumentToFolder(doc)
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.spec!.operation.security).toEqual([])
  })

  it('operation with explicit security override has security in its spec', () => {
    const doc = makeDoc({
      components: { securitySchemes: { api_key: { type: 'apiKey', name: 'api_key', in: 'header' } } },
      paths: {
        '/pet/{petId}': {
          get: { summary: 'Find pet by ID.', security: [{ api_key: [] }], responses: ok200 },
        },
      },
    })
    const folder = convertDocumentToFolder(doc)
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.spec).toBeDefined()
    expect(req.spec!.operation.security).toBeDefined()
  })

  it('operation with api_key-only security override has it preserved in its spec', () => {
    const doc = makeDoc({
      components: { securitySchemes: { api_key: { type: 'apiKey', name: 'api_key', in: 'header' } } },
      paths: {
        '/store/inventory': {
          get: { summary: 'Returns pet inventories by status.', security: [{ api_key: [] }], responses: ok200 },
        },
      },
    })
    const folder = convertDocumentToFolder(doc)
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.spec).toBeDefined()
    expect(req.spec!.operation.security).toEqual([{ api_key: [] }])
  })
})

describe('adds auth header to request when security override exists on request itself', () => {
  function makeDocWithOperationSecurity(
    operationSecurity: OpenAPIV3.SecurityRequirementObject[],
    securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>,
  ) {
    return convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      components: { securitySchemes },
      paths: {
        '/pets': {
          get: { summary: 'List Pets', security: operationSecurity, responses: ok200 },
        },
      },
    })
  }

  it('bearer', () => {
    const folder = makeDocWithOperationSecurity(
      [{ bearerAuth: [] }],
      { bearerAuth: { type: 'http', scheme: 'bearer' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('Authorization: bearer(<BEARERAUTH_TOKEN>)')
  })

  it('basic', () => {
    const folder = makeDocWithOperationSecurity(
      [{ basicAuth: [] }],
      { basicAuth: { type: 'http', scheme: 'basic' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('Authorization: basicAuth(<BASICAUTH_USERNAME>,<BASICAUTH_PASSWORD>)')
  })

  it('apiKey-in-header', () => {
    const folder = makeDocWithOperationSecurity(
      [{ apiKey: [] }],
      { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('X-API-Key: <APIKEY_KEY>')
  })

  it('apiKey-in-query', () => {
    const folder = makeDocWithOperationSecurity(
      [{ apiKey: [] }],
      { apiKey: { type: 'apiKey', name: 'api_key', in: 'query' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('api_key=<APIKEY_KEY>')
  })

  it('no security', () => {
    const folder = convertDocumentToFolder({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      security: [{ bearerAuth: [] }],
      components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
      paths: {
        '/pets': {
          get: { summary: 'List Pets', responses: ok200 },
        },
      },
    })
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).not.toContain('Authorization')
  })

  it('empty security', () => {
    const folder = makeDocWithOperationSecurity(
      [],
      { bearerAuth: { type: 'http', scheme: 'bearer' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).not.toContain('Authorization')
  })

  it('uses first OR-requirement only when multiple requirements exist', () => {
    const folder = makeDocWithOperationSecurity(
      [{ bearerAuth: [] }, { apiKey: [] }],
      {
        bearerAuth: { type: 'http', scheme: 'bearer' },
        apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' },
      },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('Authorization: bearer(<BEARERAUTH_TOKEN>)')
    expect(req.request).not.toContain('X-API-Key')
  })

  it('multiple required auth', () => {
    const folder = makeDocWithOperationSecurity(
      [{ bearerAuth: [], apiKey: [] }],
      { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, bearerAuth: { type: 'http', scheme: 'bearer' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('X-API-Key: <APIKEY_KEY>')
    expect(req.request).toContain('Authorization: bearer(<BEARERAUTH_TOKEN>)')
  })

  it('apiKey-in-header named api_key includes api_key header in request text', () => {
    const folder = makeDocWithOperationSecurity(
      [{ api_key: [] }],
      { api_key: { type: 'apiKey', name: 'api_key', in: 'header' } },
    )
    const req = folder.items.find(isRequest) as ImportedRequest
    expect(req.request).toContain('api_key: <API_KEY_KEY>')
  })
})

