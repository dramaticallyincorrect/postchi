import { describe, it, expect, beforeAll } from "vitest";
import { convertOpenApiToPostchi, convertDocumentToFolder, extractGlobalSecurity, buildRequestSpec } from "./open-api-parser";
import { ImportedFolder, ImportedRequest } from "../postman/postman-parser";
import { OpenAPIV3 } from "openapi-types";
import fs from "fs/promises";

const SPEC_PATH = '/tmp/petstore.yaml';

function isFolder(item: ImportedFolder | ImportedRequest): item is ImportedFolder {
  return 'items' in item;
}

function isRequest(item: ImportedFolder | ImportedRequest): item is ImportedRequest {
  return 'request' in item;
}

describe('open api parser', () => {

  beforeAll(async () => {
    await fs.writeFile(SPEC_PATH, spec);
    // await DefaultFileStorage.getInstance().mkdir('/tmp');
    // await DefaultFileStorage.getInstance().writeText(SPEC_PATH, spec);
  });

  it('sets root folder name from info.title', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    expect(result.name).toBe('Swagger Petstore - OpenAPI 3.0');
  });

  it('creates sub-folders for each tag', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const folderNames = result.items.filter(isFolder).map(f => f.name);
    expect(folderNames).toContain('pet');
    expect(folderNames).toContain('store');
    expect(folderNames).toContain('user');
  });

  it('uses summary as request name', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const requestNames = petFolder.items.filter(isRequest).map(r => r.name);
    expect(requestNames).toContain('Find pet by ID.');
  });

  it('converts path params {param} to <param>', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const getPetById = petFolder.items.find(i => isRequest(i) && i.name === 'Find pet by ID.') as ImportedRequest;
    expect(getPetById.request).toContain('/pet/<petId>');
    expect(getPetById.request).not.toContain('{petId}');
  });

  it('appends query params to URL', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const findByStatus = petFolder.items.find(i => isRequest(i) && i.name === 'Finds Pets by status.') as ImportedRequest;
    expect(findByStatus.request).toContain('?status=<status>');
  });

  it('adds Content-Type header and JSON body for application/json requests', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const addPet = petFolder.items.find(i => isRequest(i) && i.name === 'Add a new pet to the store.') as ImportedRequest;
    expect(addPet.request).toContain('Content-Type: application/json');
    expect(addPet.request).toContain('@body');
  });

  it('uses example values in JSON skeleton', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const addPet = petFolder.items.find(i => isRequest(i) && i.name === 'Add a new pet to the store.') as ImportedRequest;
    expect(addPet.request).toContain('"name": "doggie"');
  });

  it('uses relative URL without prepending server base URL', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const addPet = petFolder.items.find(i => isRequest(i) && i.name === 'Add a new pet to the store.') as ImportedRequest;
    expect(addPet.request).toMatch(/^POST \/pet/);
  });

  it('adds header params as request headers', async () => {
    const result = await convertOpenApiToPostchi(SPEC_PATH);
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder;
    const deletePet = petFolder.items.find(i => isRequest(i) && i.name === 'Deletes a pet.') as ImportedRequest;
    expect(deletePet.request).toContain('api_key: <api_key>');
  });

});

describe('query param value generation', () => {
  const ok200 = { '200': { description: 'OK' } }

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
})

const ok200 = { '200': { description: 'OK' } }

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

  it('returns undefined for the petstore spec which has no global security', async () => {
    const doc = await import('fs/promises').then(fs =>
      fs.readFile('/tmp/petstore.yaml', 'utf-8').then(content => {
        // petstore has no top-level `security` field, only per-operation
        const SwaggerParser = require('@apidevtools/swagger-parser')
        return SwaggerParser.dereference(
          require('js-yaml').load(content) as OpenAPIV3.Document
        ) as Promise<OpenAPIV3.Document>
      })
    )
    expect(extractGlobalSecurity(doc)).toBeUndefined()
  })
})

describe('buildRequestSpec', () => {
  it('includes method and path', () => {
    const operation: OpenAPIV3.OperationObject = { responses: ok200 }
    const spec = buildRequestSpec('get', '/pets', operation)
    expect(spec.method).toBe('get')
    expect(spec.path).toBe('/pets')
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

  it('petstore: GET /pet/{petId} has explicit security in its spec (api_key override)', async () => {
    const result = await convertOpenApiToPostchi('/tmp/petstore.yaml')
    const petFolder = result.items.find(i => isFolder(i) && i.name === 'pet') as ImportedFolder
    const getPetById = petFolder.items.find(i => isRequest(i) && i.name === 'Find pet by ID.') as ImportedRequest
    expect(getPetById.spec).toBeDefined()
    expect(getPetById.spec!.operation.security).toBeDefined()
  })

  it('petstore: GET /store/inventory has explicit security in its spec (api_key only)', async () => {
    const result = await convertOpenApiToPostchi('/tmp/petstore.yaml')
    const storeFolder = result.items.find(i => isFolder(i) && i.name === 'store') as ImportedFolder
    const getInventory = storeFolder.items.find(i => isRequest(i) && i.name === 'Returns pet inventories by status.') as ImportedRequest
    expect(getInventory.spec).toBeDefined()
    expect(getInventory.spec!.operation.security).toEqual([{ api_key: [] }])
  })
})

const spec = `
openapi: 3.0.4
info:
  title: Swagger Petstore - OpenAPI 3.0
  description: |-
    This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
    Swagger at [https://swagger.io](https://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
    You can now help us improve the API whether it's by making changes to the definition itself or to the code.
    That way, with time, we can improve the API in general, and expose some of the new features in OAS3.

    Some useful links:
    - [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
    - [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)
  termsOfService: https://swagger.io/terms/
  contact:
    email: apiteam@swagger.io
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html
  version: 1.0.27
externalDocs:
  description: Find out more about Swagger
  url: https://swagger.io
servers:
- url: /api/v3
tags:
- name: pet
  description: Everything about your Pets
  externalDocs:
    description: Find out more
    url: https://swagger.io
- name: store
  description: Access to Petstore orders
  externalDocs:
    description: Find out more about our store
    url: https://swagger.io
- name: user
  description: Operations about user
paths:
  /pet:
    put:
      tags:
      - pet
      summary: Update an existing pet.
      description: Update an existing pet by Id.
      operationId: updatePet
      requestBody:
        description: Update an existent pet in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
          application/xml:
            schema:
              $ref: '#/components/schemas/Pet'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Pet'
        required: true
      responses:
        "200":
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        "400":
          description: Invalid ID supplied
        "404":
          description: Pet not found
        "422":
          description: Validation exception
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
    post:
      tags:
      - pet
      summary: Add a new pet to the store.
      description: Add a new pet to the store.
      operationId: addPet
      requestBody:
        description: Create a new pet in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
          application/xml:
            schema:
              $ref: '#/components/schemas/Pet'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Pet'
        required: true
      responses:
        "200":
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        "400":
          description: Invalid input
        "422":
          description: Validation exception
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
  /pet/findByStatus:
    get:
      tags:
      - pet
      summary: Finds Pets by status.
      description: Multiple status values can be provided with comma separated strings.
      operationId: findPetsByStatus
      parameters:
      - name: status
        in: query
        description: Status values that need to be considered for filter
        required: true
        explode: true
        schema:
          type: string
          default: available
          enum:
          - available
          - pending
          - sold
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
        "400":
          description: Invalid status value
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
  /pet/findByTags:
    get:
      tags:
      - pet
      summary: Finds Pets by tags.
      description: "Multiple tags can be provided with comma separated strings. Use\
        \\ tag1, tag2, tag3 for testing."
      operationId: findPetsByTags
      parameters:
      - name: tags
        in: query
        description: Tags to filter by
        required: true
        explode: true
        schema:
          type: array
          items:
            type: string
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
        "400":
          description: Invalid tag value
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
  /pet/{petId}:
    get:
      tags:
      - pet
      summary: Find pet by ID.
      description: Returns a single pet.
      operationId: getPetById
      parameters:
      - name: petId
        in: path
        description: ID of pet to return
        required: true
        schema:
          type: integer
          format: int64
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        "400":
          description: Invalid ID supplied
        "404":
          description: Pet not found
        default:
          description: Unexpected error
      security:
      - api_key: []
      - petstore_auth:
        - write:pets
        - read:pets
    post:
      tags:
      - pet
      summary: Updates a pet in the store with form data.
      description: Updates a pet resource based on the form data.
      operationId: updatePetWithForm
      parameters:
      - name: petId
        in: path
        description: ID of pet that needs to be updated
        required: true
        schema:
          type: integer
          format: int64
      - name: name
        in: query
        description: Name of pet that needs to be updated
        schema:
          type: string
      - name: status
        in: query
        description: Status of pet that needs to be updated
        schema:
          type: string
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
        "400":
          description: Invalid input
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
    delete:
      tags:
      - pet
      summary: Deletes a pet.
      description: Delete a pet.
      operationId: deletePet
      parameters:
      - name: api_key
        in: header
        description: ""
        required: false
        schema:
          type: string
      - name: petId
        in: path
        description: Pet id to delete
        required: true
        schema:
          type: integer
          format: int64
      responses:
        "200":
          description: Pet deleted
        "400":
          description: Invalid pet value
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
  /pet/{petId}/uploadImage:
    post:
      tags:
      - pet
      summary: Uploads an image.
      description: Upload image of the pet.
      operationId: uploadFile
      parameters:
      - name: petId
        in: path
        description: ID of pet to update
        required: true
        schema:
          type: integer
          format: int64
      - name: additionalMetadata
        in: query
        description: Additional Metadata
        required: false
        schema:
          type: string
      requestBody:
        content:
          application/octet-stream:
            schema:
              type: string
              format: binary
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        "400":
          description: No file uploaded
        "404":
          description: Pet not found
        default:
          description: Unexpected error
      security:
      - petstore_auth:
        - write:pets
        - read:pets
  /store/inventory:
    get:
      tags:
      - store
      summary: Returns pet inventories by status.
      description: Returns a map of status codes to quantities.
      operationId: getInventory
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                type: object
                additionalProperties:
                  type: integer
                  format: int32
        default:
          description: Unexpected error
      security:
      - api_key: []
  /store/order:
    post:
      tags:
      - store
      summary: Place an order for a pet.
      description: Place a new order in the store.
      operationId: placeOrder
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
          application/xml:
            schema:
              $ref: '#/components/schemas/Order'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/Order'
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        "400":
          description: Invalid input
        "422":
          description: Validation exception
        default:
          description: Unexpected error
  /store/order/{orderId}:
    get:
      tags:
      - store
      summary: Find purchase order by ID.
      description: For valid response try integer IDs with value <= 5 or > 10. Other
        values will generate exceptions.
      operationId: getOrderById
      parameters:
      - name: orderId
        in: path
        description: ID of order that needs to be fetched
        required: true
        schema:
          type: integer
          format: int64
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
            application/xml:
              schema:
                $ref: '#/components/schemas/Order'
        "400":
          description: Invalid ID supplied
        "404":
          description: Order not found
        default:
          description: Unexpected error
    delete:
      tags:
      - store
      summary: Delete purchase order by identifier.
      description: For valid response try integer IDs with value < 1000. Anything
        above 1000 or non-integers will generate API errors.
      operationId: deleteOrder
      parameters:
      - name: orderId
        in: path
        description: ID of the order that needs to be deleted
        required: true
        schema:
          type: integer
          format: int64
      responses:
        "200":
          description: order deleted
        "400":
          description: Invalid ID supplied
        "404":
          description: Order not found
        default:
          description: Unexpected error
  /user:
    post:
      tags:
      - user
      summary: Create user.
      description: This can only be done by the logged in user.
      operationId: createUser
      requestBody:
        description: Created user object
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
          application/xml:
            schema:
              $ref: '#/components/schemas/User'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
            application/xml:
              schema:
                $ref: '#/components/schemas/User'
        default:
          description: Unexpected error
  /user/createWithList:
    post:
      tags:
      - user
      summary: Creates list of users with given input array.
      description: Creates list of users with given input array.
      operationId: createUsersWithListInput
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/User'
      responses:
        "200":
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
            application/xml:
              schema:
                $ref: '#/components/schemas/User'
        default:
          description: Unexpected error
  /user/login:
    get:
      tags:
      - user
      summary: Logs user into the system.
      description: Log into the system.
      operationId: loginUser
      parameters:
      - name: username
        in: query
        description: The user name for login
        required: false
        schema:
          type: string
      - name: password
        in: query
        description: The password for login in clear text
        required: false
        schema:
          type: string
      responses:
        "200":
          description: successful operation
          headers:
            X-Rate-Limit:
              description: calls per hour allowed by the user
              schema:
                type: integer
                format: int32
            X-Expires-After:
              description: date in UTC when token expires
              schema:
                type: string
                format: date-time
          content:
            application/xml:
              schema:
                type: string
            application/json:
              schema:
                type: string
        "400":
          description: Invalid username/password supplied
        default:
          description: Unexpected error
  /user/logout:
    get:
      tags:
      - user
      summary: Logs out current logged in user session.
      description: Log user out of the system.
      operationId: logoutUser
      parameters: []
      responses:
        "200":
          description: successful operation
        default:
          description: Unexpected error
  /user/{username}:
    get:
      tags:
      - user
      summary: Get user by user name.
      description: Get user detail based on username.
      operationId: getUserByName
      parameters:
      - name: username
        in: path
        description: The name that needs to be fetched. Use user1 for testing
        required: true
        schema:
          type: string
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
            application/xml:
              schema:
                $ref: '#/components/schemas/User'
        "400":
          description: Invalid username supplied
        "404":
          description: User not found
        default:
          description: Unexpected error
    put:
      tags:
      - user
      summary: Update user resource.
      description: This can only be done by the logged in user.
      operationId: updateUser
      parameters:
      - name: username
        in: path
        description: name that need to be deleted
        required: true
        schema:
          type: string
      requestBody:
        description: Update an existent user in the store
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
          application/xml:
            schema:
              $ref: '#/components/schemas/User'
          application/x-www-form-urlencoded:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        "200":
          description: successful operation
        "400":
          description: bad request
        "404":
          description: user not found
        default:
          description: Unexpected error
    delete:
      tags:
      - user
      summary: Delete user resource.
      description: This can only be done by the logged in user.
      operationId: deleteUser
      parameters:
      - name: username
        in: path
        description: The name that needs to be deleted
        required: true
        schema:
          type: string
      responses:
        "200":
          description: User deleted
        "400":
          description: Invalid username supplied
        "404":
          description: User not found
        default:
          description: Unexpected error
components:
  schemas:
    Order:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        petId:
          type: integer
          format: int64
          example: 198772
        quantity:
          type: integer
          format: int32
          example: 7
        shipDate:
          type: string
          format: date-time
        status:
          type: string
          description: Order Status
          example: approved
          enum:
          - placed
          - approved
          - delivered
        complete:
          type: boolean
      xml:
        name: order
    Category:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 1
        name:
          type: string
          example: Dogs
      xml:
        name: category
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        username:
          type: string
          example: theUser
        firstName:
          type: string
          example: John
        lastName:
          type: string
          example: James
        email:
          type: string
          example: john@email.com
        password:
          type: string
          example: "12345"
        phone:
          type: string
          example: "12345"
        userStatus:
          type: integer
          description: User Status
          format: int32
          example: 1
      xml:
        name: user
    Tag:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
      xml:
        name: tag
    Pet:
      required:
      - name
      - photoUrls
      type: object
      properties:
        id:
          type: integer
          format: int64
          example: 10
        name:
          type: string
          example: doggie
        category:
          $ref: '#/components/schemas/Category'
        photoUrls:
          type: array
          xml:
            wrapped: true
          items:
            type: string
            xml:
              name: photoUrl
        tags:
          type: array
          xml:
            wrapped: true
          items:
            $ref: '#/components/schemas/Tag'
        status:
          type: string
          description: pet status in the store
          enum:
          - available
          - pending
          - sold
      xml:
        name: pet
    ApiResponse:
      type: object
      properties:
        code:
          type: integer
          format: int32
        type:
          type: string
        message:
          type: string
      xml:
        name: '##default'
  requestBodies:
    Pet:
      description: Pet object that needs to be added to the store
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Pet'
        application/xml:
          schema:
            $ref: '#/components/schemas/Pet'
    UserArray:
      description: List of user object
      content:
        application/json:
          schema:
            type: array
            items:
              $ref: '#/components/schemas/User'
  securitySchemes:
    petstore_auth:
      type: oauth2
      flows:
        implicit:
          authorizationUrl: https://petstore3.swagger.io/oauth/authorize
          scopes:
            write:pets: modify pets in your account
            read:pets: read your pets
    api_key:
      type: apiKey
      name: api_key
      in: header
`
