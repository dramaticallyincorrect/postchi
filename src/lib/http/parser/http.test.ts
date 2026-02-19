import { test } from 'vitest'
import { parser } from "./parser.js"
import { testTree } from "@lezer/generator/test"

test('request line', () => {
  const defaultValue = `
  POST /api/v1/data spaces `;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path))`

  testTree(tree, spec)

})

test('relative at root', () => {
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

test('request line with variables', () => {
  const defaultValue = `
  POST /api/v1/data spaces <<url>>allowed <<second>>in path`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path(Variable, Variable)))`

  testTree(tree, spec)

})

test('header', () => {
  const defaultValue = `
POST <<variable>>/api/v1/data spaces <<url>>allowed <<second>>in path
hea@der : val@ue
a`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path(Variable,Variable,Variable)),
                Header(Key, Value),
                Header(Key))`
  testTree(tree, spec)

})


test('header no key', () => {
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


test('header only empty space for key are ignored', () => {
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

test('header with slashes in value', () => {
  const defaultValue = `
POST /path
header: application/json`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path)
                Header(Key, Value))`
  testTree(tree, spec)

})

test('multiple headers', () => {
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

test('header with variable as values', () => {
  const defaultValue = `
  POST /api/v1/data
  header1 one : value1 value2
  header2: <<variable>>`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path,),
                Header(Key, Value),
                Header(Key, Variable))`
  testTree(tree, spec)

})

test('header with function as values', () => {
  const defaultValue = `
  POST /api/v1/data
  header2:basic()`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path,),
                Header(Key, Function(FunctionName)))`


  testTree(tree, spec)

})

test('json body', () => {
  const defaultValue = `
  POST /api/v1/data
  @body 
  {
    "name": "John",
    "age": 30,
    "city": "New York"
  }`;
  const tree = parser.parse(defaultValue)
  let spec = `Request(
                RequestLine(
                  Method,
                  Path),
                BodyStart, Body(JsonBody))`

  testTree(tree, spec)

})

test('form body', () => {
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

test('text body', () => {
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