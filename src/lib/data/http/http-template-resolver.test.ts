import { describe, expect, it } from "vitest";
import resolveHttpTemplate from "./http-template-resolver";


describe('creates http request from ast', () => {

    it('only literals', () => {

        const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            
                            {}
                            `.trim()


        const httpRequest = resolveHttpTemplate(template);
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
        it('in url', () => {

            const path = '<api>'
            const id = '<id>'
            const template = `GET https://getpostchi.com/${path}/${id}`.trim()


            const httpRequest = resolveHttpTemplate(template, {
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

        it('in header', () => {

            const template = `GET https://getpostchi.com
            Authorization: <id>
            x-api: <api>
            `.trim()


            const httpRequest = resolveHttpTemplate(template, {
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


    describe('body', () => {
        it('json is converted to text', () => {

            const body = '{"client": "postchi", "user": "chi"}'
            const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            ${body}
                            `.trim()


            const httpRequest = resolveHttpTemplate(template);
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
            it('url encoded uses URLSearchParams', () => {
                const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            client= postchi
                            user= chi
                            `.trim()


                const httpRequest = resolveHttpTemplate(template);
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

            it('multipart uses FormData', () => {
                const template = `GET https://getpostchi.com/download
                            Content-Type: multipart/form-data
                            @body
                            client= postchi
                            user= chi
                            `.trim()


                const httpRequest = resolveHttpTemplate(template);

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
        })


    })

    it('returns null if any errors exist', () => {
        // error is urlencoded body with file attached
        const template = `GET https://getpostchi.com/download
                            Content-Type: application/x-www-form-urlencoded
                            @body
                            client= postchi
                            user= readFile()
                            `.trim()


        const httpRequest = resolveHttpTemplate(template);

        expect(httpRequest, template).toStrictEqual({
            message: 'request contains errors'
        });
    })

})