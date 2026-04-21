# Roadmap

1. v1.2.0
   3. ~~os independent paths for stored paths~~
   5. plus move update trigger to side panel
   6. ask to buy license every once in a while
   8. ~~split view -> code is there but disabled til i'm more sure of the ui~~
   9. ~~multi tabs -> code is there but disabled til i'm more sure of the ui~~
   10. ~~none json body in response view~~
   11. ~~octet stream body~~
   12. temporary request + add to empty view shortcuts
2. copy as cURL
3. animate split view and new tab inserted
4. paste cURL
5. sources -> spec only change, like parameter becomes required
6. settings -> disable usage and diagnostic tracking
7. errors
   1. unexpected token, text after a variable or function in header
   2.  MissingKey
   3.  DuplicateValue
   4.  MissingValue
   5.  FilePathNotExist
   6.  PathIsDirectory
   7.  InvalidContentType
   8.  Invalid Environment (empty name)
8. multi window
9. recent projects
10. script improvements
   1. auto complete using typescript compiler
   2. tests
11. graphQL
12. view
   1.  split view
   2.  overlay view
   3.  folder settings opens overlaying response panel when a request is in view
13. Sources
   1. values with enum should use a value from that as default value when importing rather than <name>
   2. settings ui
      1. auth 'and' logic
         1. group as one item
      2. no auth delete if defined in source, can add empty auth to allow it
   3. diff
      1. things to change since we want to show deviations from the spec as warning (because when you are working on a backend you still haven't updated the spec but still want to be able to make a request)
      2. ~~diff against spec since if we remove a value from request temporarily don't want to get change updates for that~~
      3. ~~*check if files on disk exist, if not consider that an add, this solves sharing the project without commiting the requests*~~
      4. *merge with existing, keep changes even if they don't conform to the spec*
      5. spec file deleted
   4. optional parameters
      1. ~~not added to request on import~~
      2. shown in right click context
   5. authentication
      1. general
   6. test parse failures
   7. right click options
      1. sub item for query items with enum or array
   8.  refactor
      1. folder settings auth resolver, take request returned authenticated
   9.  spec integration
      1. lint
      2. autocomplete
         1. body
         2. fill in whole body, everything required
      3. default value in right click menu?
      4. hover tooltip
         1. default value
         2. optional or required
         3. arrays -> one or more of ...items
14. performance optimizations 
   1. scope tree changes to the folder that changed
   2. render file tree items lazyly
15. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
16. actions
   1. show hint when it's empty
   2. pass current request to actions if a request is active when executing the action
17. search
   1. recent requests
   2. request text search
   3. open tabs
18. security
   1. stripout auth from history by default
      1. setting to override it
19. file tree
        1. rename
        2. view options
           1. show/hide scripts
        3. open scripts after creation
        4. move script creation out of FileTree
        5. show request urls as filenames and group by path?
        6. pin to top
           1. group pins in one folder
20. save file  
    1. when closing the app
21. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. write tests for rust project file reader
22. bugs
    1. sending request to localhost with no server gives ambiguis error -> error sending request for url (http://localhost:8080/login)
