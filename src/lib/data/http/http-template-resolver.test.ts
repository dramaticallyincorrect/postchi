import { describe, expect, it } from "vitest";
import resolveHttpTemplate from "./http-template-resolver";
import { fs } from "memfs";


describe('creates http request from ast', () => {

    it('only literals', async () => {

        const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            
                            {}
                            `.trim()


        const httpRequest = await resolveHttpTemplate(template);
        expect(httpRequest, template).toStrictEqual({
            method: "GET",
            url: "https://getpostchi.com/download",
            headers: [
                ["Authorization", "Bearer 12345"]
            ],
            body: `{}`
        });


    })

    describe('variables', () => {
        it('in url', async () => {

            const path = '<api>'
            const id = '<id>'
            const template = `GET https://getpostchi.com/${path}/${id}`.trim()


            const httpRequest = await resolveHttpTemplate(template, {
                variables: new Map([
                    ["api", "download"],
                    ["id", "12345"]
                ])
            });

            expect(httpRequest, template).toStrictEqual({
                method: "GET",
                url: "https://getpostchi.com/download/12345",
                headers: [],
                body: ''
            });

        })

        it('in header', async () => {

            const template = `GET https://getpostchi.com
            Authorization: <id>
            x-api: <api>
            `.trim()


            const httpRequest = await resolveHttpTemplate(template, {
                variables: new Map([
                    ["api", "download"],
                    ["id", "12345"]
                ])
            });

            expect(httpRequest, template).toStrictEqual({
                method: "GET",
                url: "https://getpostchi.com",
                headers: [
                    ["Authorization", "12345"],
                    ["x-api", "download"]
                ],
                body: ''
            });

        })
    })

    describe('functions', () => {
        it('in header', async () => {

            const token = '12345'

            const template = `GET https://getpostchi.com
            Authorization: bearer(${token})
            `.trim()


            const httpRequest = await resolveHttpTemplate(template, {
                variables: new Map([
                    ["api", "download"],
                    ["id", "12345"]
                ])
            });

            expect(httpRequest, template).toStrictEqual({
                method: "GET",
                url: "https://getpostchi.com",
                headers: [
                    ["Authorization", `Bearer ${token}`],
                ],
                body: ''
            });
        })

        it('in body', async () => {

            const token = '12345'

            const template = `GET https://getpostchi.com
            @body
            Authorization= bearer(${token})
            `.trim()


            const httpRequest = await resolveHttpTemplate(template, {
                variables: new Map([
                    ["api", "download"],
                    ["id", "12345"]
                ])
            });

            const params = new URLSearchParams();
            params.append("Authorization", `Bearer ${token}`)

            expect(httpRequest, template).toStrictEqual({
                method: "GET",
                url: "https://getpostchi.com",
                headers: [],
                body: params
            });
        })
    })


    describe('body', () => {
        it('json is converted to text', async () => {

            const body = '{"client": "postchi", "user": "chi"}'
            const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            ${body}
                            `.trim()


            const httpRequest = await resolveHttpTemplate(template);
            expect(httpRequest, template).toStrictEqual({
                method: "GET",
                url: "https://getpostchi.com/download",
                headers: [
                    ["Authorization", "Bearer 12345"]
                ],
                body: body
            });
        })

        describe('form', () => {
            it('url encoded uses URLSearchParams', async () => {
                const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            client= postchi
                            user= chi
                            `.trim()


                const httpRequest = await resolveHttpTemplate(template);
                expect(httpRequest, template).toStrictEqual({
                    method: "GET",
                    url: "https://getpostchi.com/download",
                    headers: [
                        ["Authorization", "Bearer 12345"]
                    ],
                    body: new URLSearchParams([
                        ["client", "postchi"],
                        ["user", "chi"]
                    ])
                });
            })

            it('multipart uses FormData', async () => {
                const template = `GET https://getpostchi.com/download
                            Content-Type: multipart/form-data
                            @body
                            client= postchi
                            user= chi
                            `.trim()


                const httpRequest = await resolveHttpTemplate(template);

                const formData = new FormData();
                formData.append("client", "postchi");
                formData.append("user", "chi");

                expect(httpRequest, template).toStrictEqual({
                    method: "GET",
                    url: "https://getpostchi.com/download",
                    headers: [
                        ["Content-Type", "multipart/form-data"]
                    ],
                    body: formData
                });
            })


            it('multipart with file attaches blob to form data', async () => {
                const path = '/test.png'
                const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
                fs.writeFileSync(path, data);
                const template = `GET https://getpostchi.com/download
                            Content-Type: multipart/form-data
                            @body
                            client= readFile(${path})
                            user= chi
                            `.trim()


                const httpRequest = await resolveHttpTemplate(template);

                const formData = new FormData();
                formData.append("user", "chi");
                formData.append("client", new Blob([data]));

                expect(httpRequest, template).toStrictEqual({
                    method: "GET",
                    url: "https://getpostchi.com/download",
                    headers: [
                        ["Content-Type", "multipart/form-data"]
                    ],
                    body: formData
                });
            })


        })


    })

    it('returns null if any errors exist', async () => {
        // error is urlencoded body with file attached
        const template = `GET https://getpostchi.com/download
                            Content-Type: application/x-www-form-urlencoded
                            @body
                            client= postchi
                            user= readFile()
                            `.trim()


        const httpRequest = await resolveHttpTemplate(template);

        expect(httpRequest, template).toStrictEqual({
            message: 'request contains errors'
        });
    })

})