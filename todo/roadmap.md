# Roadmap

1. release checks
   1. ~~test auto updates~~
   2. ~~create and configure app icon~~
   3. set prod url for license
   4. test license validation/activation
   5. finish remaining lint errors
   6. fix bugs
      1. secrets not being applied
      2. create folder and env change not synced immediatley
      3. GET /todos
User-Agent: Postchi
Authorization: readText(/Users/hamedmonji/secrets.env)
shows wrong syntax highlighting for secrets
   7. release v0.1.0
   8. setup usage/diagnostic tracking
   9. add end to end tests
   10. test
1. search
   1. recent requests
2. reorganize packages
3. file tree
    1. rename
    2. view options
       1. show/hide scripts
    3. open scripts after creation
    4. move script creation out of FileTree
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
      1. args with spaces or trailing spaces
      2. context aware values
      3. body snippet
8. save file  
    1. when closing the app
9. errors
    1. MissingKey
    2. DuplicateValue
    3. MissingValue
    4. FilePathNotExist
    5. PathIsDirectory
    6. RelativeUrlShouldStartWithSlash
    7. InvalidContentType
    8. JsonBodyError
    9. Invalid Environment (empty name)
10. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
11. octet stream body
