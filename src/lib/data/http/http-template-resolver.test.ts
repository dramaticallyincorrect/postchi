import { describe, expect, it } from "vitest";
import resolveHttpTemplate from "./http-template-resolver";


describe('creates http request from ast', () => {

    it('only literals', () => {

        const template = `GET https://getpostchi.com/download
                            Authorization: Bearer 12345
                            @body
                            `.trim()


        const httpRequest = resolveHttpTemplate(template);
        expect(httpRequest, template).toStrictEqual({
            method: "GET",
            url: "https://getpostchi.com/download",
            headers: [
                ["Authorization", "Bearer 12345"]
            ],
            body: ``
        });


    })



})