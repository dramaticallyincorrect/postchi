import resolveHttpTemplate from "./http-template-resolver";
// import { fetch } from '@tauri-apps/plugin-http'

export default function executeHttpTemplate(template: string): Promise<Response> {

    const request = resolveHttpTemplate(template)

    return fetch(request.url, {
        method: request.method,
        headers: request.headers,
        // body: request.body
    });


}
