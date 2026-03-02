import resolveHttpTemplate from "./http-template-resolver";
// import { fetch } from '@tauri-apps/plugin-http'

export default function executeHttpTemplate(template: string): Promise<Response | null> {

    const request = resolveHttpTemplate(template)

    if (!request || 'message' in request) {
        return Promise.resolve(null)
    }

    return fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body
    });


}
