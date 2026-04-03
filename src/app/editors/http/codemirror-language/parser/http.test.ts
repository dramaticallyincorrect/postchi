import { describe, it, test } from 'vitest'
import { parser } from "./parser.js"
import { testTree } from "@lezer/generator/test"

describe('request line', () => {

  it('absolute url with all characters', () => {
    const defaultValue = `
  POST https://testpages.eviltester.com/pages/auth/basic-auth/basic-auth%:-results.html#path?a=b&c=d`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path))`
    testTree(tree, spec)

  })

  it('relative at root', () => {
    const defaultValue = `
  POST /
  `;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path))`
    testTree(tree, spec)

  })

  it('variables', () => {
    const defaultValue = `
  POST /api/v1/data spaces <url>allowed <second>in path`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path(Variable, Variable)))`

    testTree(tree, spec)

  })

})

describe('headers', () => {

  const requestOf = (rest: string) => `
POST <variable>/api/v1/data spaces <url>allowed <second>in path
${rest}`.trim()

  it('key : value', () => {
    const defaultValue = requestOf(`header : value`);
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path(Variable,Variable,Variable)),
                Header(Key, Value))`
    testTree(tree, spec)
  })


  it('no key', () => {
    const defaultValue = `
POST /
: value/df`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                Header(Value))`
    testTree(tree, spec)

  })


  it('empty space before key are ignored', () => {
    const defaultValue = `
POST /
  : value/df`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                Header(Value))`
    testTree(tree, spec)

  })

  it('all possible value characters', () => {
    const defaultValue = `
POST /path
header: application/json+-._~!@#$%^&*=|;`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path)
                Header(Key, Value))`
    testTree(tree, spec)

  })

  it('multiple headers', () => {
    const defaultValue = `
  POST /api/v1/data
  header1: value1 stil value1`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path,),
                Header(Key, Value))`
    testTree(tree, spec)

  })

  it('key : variable', () => {
    const defaultValue = `
  POST /api/v1/data
  header1 one : value1 value2
  header2: <variable>`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path,),
                Header(Key, Value),
                Header(Key, Variable))`
    testTree(tree, spec)

  })

  it('key : nested function', () => {
    const defaultValue = `
  POST /api/v1/data
  header2: basic(username, join(password, secret))`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path,),
                Header(Key, Function(FunctionName, Value, Function(FunctionName,Value,⚠,Value))))`


    testTree(tree, spec)

  })
})

describe('body', () => {
  const requestOf = (body: string,) => `
POST /

@body
${body}`.trim()
  it('json', () => {
    const defaultValue = requestOf(`
{
  "name": "John",
  "age": 30,
  "city": "New York"
}`);
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                BodyStart, Body(JsonBody))`

    testTree(tree, spec)

  })

  it('form', () => {
    const defaultValue = `
  POST /api/v1/data
  @body 
  username = john_doe`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                BodyStart, Body(FormBody(Key, Value)))`

    testTree(tree, spec)

  })

  it('text body', () => {
    const defaultValue = `
  POST /api/v1/data
  @body 
  this is a text body`;
    const tree = parser.parse(defaultValue)
    let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                BodyStart, Body(TextBody))`

    testTree(tree, spec)

  })
})

test('comments', () => {
  const defaultValue = `
POST /api/v1/data spaces 
// header : header value`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                  Comment)`
  testTree(tree, spec)

})