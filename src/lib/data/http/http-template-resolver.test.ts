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



})