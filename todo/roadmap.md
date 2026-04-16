# Roadmap

1. **os independent paths for stored paths**
2. release notes
3. ~~no license enforcment~~
4. Sources
   1. remove or update token from folder settings
   2. values with enum should use a value from that as default value when importing rather than <name>
   3. **settings ui**
      1. auth 'and' logic
         1. group as one item
      2. no auth delete if defined in source, can add empty auth to allow it
   4. diff
      1. things to change since we want to show deviations from the spec as warning (because when you are working on a backend you still haven't updated the spec but still want to be able to make a request)
      2. ~~diff against spec since if we remove a value from request temporarily don't want to get change updates for that~~
      3. *check if files on disk exist, if not consider that an add, this solves sharing the project without commiting the requests*
      4. *merge with existing, keep changes even if they don't conform to the spec*
      5. spec only change, like parameter becomes required
   5. optional parameters
      1. ~~not added to request on import~~
      2. shown in right click context
   6. authentication
      1. general
   7. test parse failures
   8. right click options
      1. sub item for query items with enum or array
   9.  refactor
      1. folder settings auth resolver, take request returned authenticated
   10. **spec integration**
      1. lint
      2. autocomplete
         1. body
         2. fill in whole body, everything required
      3. default value in right click menu?
      4. hover tooltip
         1. default value
         2. optional or required
         3. arrays -> one or more of ...items
5. http
   1. discreate query
      1. each query on a separate line identified by leading &
   2. context options
      1. remove all optional parameters
6. performance optimizations 
   1. scope tree changes to the folder that changed
   2. render file tree items lazyly
7. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
8. actions
   1. show hint when it's empty
   2. pass current request to actions if a request is active when executing the action
9. search
   1. recent requests
   2. request text search
10. cross platform sharing
   1. *stored paths should be linux style and converted to windows paths on windows*
      1. pinned
11. security
   1. stripout auth from history by default
      1. setting to override it
12. small stuff
    1. when importing search for auth requests, and offer to pin the request or set after script
13. file tree
    1. rename
    2. view options
       1. show/hide scripts
    3. open scripts after creation
    4. move script creation out of FileTree
    5. show request urls as filenames and group by path?
    6. pin to top
       1. group pins in one folder
14. scripts
    1. single source to derive execution and auto complete options from
15. import
    1. postman
         1. open folder after import
    2. open api
16. save file  
    1. when closing the app
17. errors
    1. unexpected token, text after a variable or function in header
    2. MissingKey
    3. DuplicateValue
    4. MissingValue
    5. FilePathNotExist
    6. PathIsDirectory
    7. InvalidContentType
    8. Invalid Environment (empty name)
18. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
    5. write tests for rust project file reader
19. octet stream body
20. folder settings
    1. **set auth**
       1. add auth methods
       2. reorder auth methods from settings
    2. run a task to change the base path for every request to relative
21. bugs
22. unverified
    1. editor right click shows optional paramters
    2. request snippet
       1. select a range of text
       2. create snippet, set a name
       3. saved to a file next to request
       4. folder snippets??
