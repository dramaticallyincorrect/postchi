# Roadmap

1. release checks
   1. ~~test auto updates~~
   2. ~~create and configure app icon~~
   3. ~~set prod url for license~~
   4. ~~test license validation/activation~~
   5. finish remaining lint errors
   6. fix bugs
      1. ~~secrets not being applied~~
      2. ~~create folder and env change not synced immediatley~~
      3. GET /todos
User-Agent: Postchi
Authorization: readText(/Users/hamedmonji/secrets.env)
shows wrong syntax highlighting for secrets
   1. release v0.1.0
   2. setup usage/diagnostic tracking
   3. add end to end tests
   4. test
1. search
   1. recent requests
2. reorganize packages
3. file tree
    1. rename
    2. view options
       1. show/hide scripts
    3. open scripts after creation
    4. move script creation out of FileTree
    5. show request urls as filenames and group by path?
4. scripts
    1. single source to derive execution and auto complete options from
5. quick actions
    1. set from file tree
6. import
    1. postman
         1. open folder after import
         2. handle errors
    2. open api
7. auto complete
      1. ~~args with spaces or trailing spaces~~
      2. ~~include colon in headername autocomplete~~
      3. context aware values
      4. body snippet
         1. ~~json~~
8. save file  
    1. when closing the app
9. errors
    1. unexpected token, text after a variable or function in header
    2. MissingKey
    3. DuplicateValue
    4. MissingValue
    5. FilePathNotExist
    6. PathIsDirectory
    7. ~~RelativeUrlShouldStartWithSlash~~
    8. InvalidContentType
    9. ~~JsonBodyError~~
    10. Invalid Environment (empty name)
10. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
11. octet stream body
