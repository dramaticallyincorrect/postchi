import { RequestSpec } from "@/postchi/sources/request-spec";
import { describe, expect, it } from "vitest";
import { collapseHttpRequest, expandHttpRequest } from "./http-spec-integration";


describe('spec integration', () => {


    it('collapse, reduces the request to minimum required fields', () => {


        const request = 'GET /api/v2/contents?content_types=Activity&source_id=<source_id>&source_code=<source_code>'

        const collapsed = collapseHttpRequest(exampleRequestSpec)


        expect(collapsed).toBe('GET /api/v2/contents')

    })

    it('expands the request to include every field keeping original values', () => {


        const request = 'GET /api/v2/contents?content_types=Activity'

        const collapsed = expandHttpRequest(request, exampleRequestSpec)


        expect(collapsed).toBe('GET /api/v2/contents?content_types=Activity&source_id=<source_id>&source_code=<source_code>')

    })

})


const exampleRequestSpec: RequestSpec = {
    method: 'get',
    path: '/api/v2/contents',
    operation: {
        tags: ['Aliases'],
        summary: 'Retrieves all Aliases',
        parameters: [
            {
                name: 'content_types',
                in: 'query',
                description: 'Filter by content type',
                schema: {
                    type: 'array',
                    items: {
                        enum: ['Activity', 'Assessment', 'Course', 'Lesson'],
                        type: 'string',
                    },
                },
            },
            {
                name: 'source_id',
                in: 'query',
                description: 'Filter by source ID',
                schema: {
                    type: 'string',
                },
            },
            {
                name: 'source_code',
                in: 'query',
                description: 'Filter by source code',
                schema: {
                    type: 'string',
                },
            },
        ],
    },
};