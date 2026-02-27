import { describe, expect, it } from "vitest";
import parseEnvironments from "./environments-parser";

describe('environments parser', () => {

    it('get all envs', () => {
        const text = `
// this is a comment
# production
username=admin
password=1234
api=https://api.example.com?token=abcd&env=production#token
# development
username=admin2
password=5678`


        const envs = parseEnvironments(text)

        expect(envs).toEqual([
            {
                name: 'production',
                variables: [
                    { key: 'username', value: 'admin' },
                    { key: 'password', value: '1234' },
                    { key: 'api', value: 'https://api.example.com?token=abcd&env=production#token' }
                ]
            },
            {
                name: 'development',
                variables: [
                    { key: 'username', value: 'admin2' },
                    { key: 'password', value: '5678' }
                ]
            }
        ])

    })

    it('skips variables with no env', () => {
        const text = `
username=admin
password=1234
api=https://api.example.com?token=abcd&env=production#token
# development
username=admin2
password=5678`

        const envs = parseEnvironments(text)

        expect(envs).toEqual([
            {
                name: 'development',
                variables: [
                    { key: 'username', value: 'admin2' },
                    { key: 'password', value: '5678' }
                ]
            }
        ])
    })

    it('skips variables with null or empty value', () => {
        const text = `
# production
username=admin
password=
api=https://api.example.com?token=abcd&env=production#token
# development
username=admin2
password=5678`

        const envs = parseEnvironments(text)

        expect(envs).toEqual([
            {
                name: 'production',
                variables: [
                    { key: 'username', value: 'admin' },
                    { key: 'api', value: 'https://api.example.com?token=abcd&env=production#token' }
                ]
            },
            {
                name: 'development',
                variables: [
                    { key: 'username', value: 'admin2' },
                    { key: 'password', value: '5678' }
                ]
            }
        ])
    })

})