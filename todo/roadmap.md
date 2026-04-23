# Roadmap

1. v1.3.0
   3. ~~os independent paths for stored paths~~
   4. ~~sources -> spec only change, like parameter becomes required~~
      1. ~~only show to the user the spec change if there were no other source changes~~
      2. ~~one entry showing local and remote spec~~
      3. ~~overwrite the existing complete spec with remote~~
      4. ~~overwrite the existing request spec wit remote~~
      5. ~~security updates~~
         1. ~~security that exist in the local spec are diffed against the remote~~
         2. ~~new security schemes overwrite local ones keeping the values set locally~~
   5. move update trigger to side panel
   6. ask to buy license every once in a while
   7. temp project should have some request and env
   9. copy as cURL
   10. rename request
   11. auth in header, query
   12. web
       1.  home page is web version + download app button
2. update documents
3. ui rethink
   1. env editor
      1. should show both env and secrets, with secrets being a series of env editors with no editable env
      2. don't show secrets in file tree
   2. http ui
4. clean up
   1. http parser
   2. http autocomplete
   3. send request
   4. scripts
5. figma design
6. split and tabs design
   1. animate split view and new tab inserted
   2. when in split view, requests have gap, in box
   3. designs to check
      1. side bar hover - panel flat
      2. remove open and close indicator with only different folder icons
7. paste cURL
8. settings -> disable usage and diagnostic trackings
9.  temporary request + add to empty view shortcuts
   1. clean send request first
10. errors
   1. unexpected token, text after a variable or function in header
   2.  MissingKey
   3.  DuplicateValue
   4.  MissingValue
   5.  FilePathNotExist
   6.  PathIsDirectory
   7.  InvalidContentType
   8.  Invalid Environment (empty name)
11. multi window
12. recent projects
13. script improvements
   1. ~~auto complete using typescript compiler~~
   2. code clean up
      1. unifiy running scripts
      2. decide weather to have scripts affect the env when they run or only schedule the updates
      3. improve http runner and scripts readability
   3. tests
      1. reseaerch usage and use cases
      2. plan the scope
      3. ui design
14. graphQL
15. view
    1.  split view
    2.  overlay view
    3.  folder settings opens overlaying response panel when a request is in view
16. Sources
   1. values with enum should use a value from that as default value when importing rather than <name>
   2. settings ui
      1. auth 'and' logic
         1. group as one item
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
17. performance optimizations 
   1. scope tree changes to the folder that changed
   2. render file tree items lazyly
18. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
19. actions
   1. show hint when it's empty
   2. pass current request to actions if a request is active when executing the action
20. search
   1. recent requests
   2. request text search
   3. open tabs
21. security
   1. stripout auth from history by default
      1. setting to override it
22. file tree
        1. rename
        2. view options
           1. show/hide scripts
        3. open scripts after creation
        4. move script creation out of FileTree
        5. show request urls as filenames and group by path?
        6. pin to top
           1. group pins in one folder
23. save file  
    1. when closing the app
24. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. write tests for rust project file reader
25. bugs
    1. sending request to localhost with no server gives ambiguis error -> error sending request for url (http://localhost:8080/login)
