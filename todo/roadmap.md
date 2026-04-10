# Roadmap

1. / for stored paths
2. Sources
   1. auth 'and' logic
   2. remove or update token from folder settings
   3. diff
      1. things to change since we want to show deviations from the spec as warning (because when you are working on a backend you still haven't updated the spec but still want to be able to make a request)
      2. ~~diff against spec since if we remove a value from request temporarily don't want to get change updates for that~~
      3. merge with existing, keep changes even if they don't conform to the spec
      4. spec only change, like parameter becomes required
   4. optional parameters
      1. ~~not added to request on import~~
      2. shown in right click context
   5. authentication
      1. **github**
      2. general
   6. test parse failures
   7. right click options
      1. reset to spec
   8. reorder auth methods from settings
   9. refactor
      1. folder settings auth resolver, take request returned authenticated
   10. spec integration
      1. lint
      2. autocomplete
3. http
   1. discreate query
      1. each query on a separate line identified by leading &
   2. context options
      1. remove all optional parameters
4. back and forward recent requests
5. request snippet
   1. select a range of text
   2. create snippet, set a name
   3. saved to a file next to request
   4. folder snippets??
6. http editor line wrap
7. performance optimizations
   1. scope tree changes to the folder that changed
8. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
9. actions - pin rethink
   1. ~~remove titlebar new action when no action exists~~
   2. ~~always show actions folder~~
   3. show hint when it's empty
   4. ~~remove shortcut keybinding (maybe can be defined by use later, we'll see)~~
   5. ~~side bar item shows a play icon to run the action from sidebar~~
   6. ~~play icon has the same progress and error indication that current titlebar action has~~
   7. ~~the common flow (run the token request) will be handled by pin request feature~~
10. search
   1. recent requests
11. security
   1. stripout auth from history by default
      1. setting to override it
12. file tree
    1. rename
    2. view options
       1. show/hide scripts
    3. open scripts after creation
    4. move script creation out of FileTree
    5. show request urls as filenames and group by path?
    6. **pin to top**
       1. ~~in postchi folder in pinned~~
       2. ~~path relative to project root, so actions can be pinned possibly in future~~
       3. ~~pinned items have an execute button -> executable trait~~
       4. ~~shift+mod+enter for first pinned -> shortcut trait~~
13. scripts
    1. single source to derive execution and auto complete options from
14. import
    1. postman
         1. open folder after import
    2. open api
15. save file  
    1. when closing the app
16. errors
    1. unexpected token, text after a variable or function in header
    2. MissingKey
    3. DuplicateValue
    4. MissingValue
    5. FilePathNotExist
    6. PathIsDirectory
    7. InvalidContentType
    8. Invalid Environment (empty name)
17. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
    5. write tests for rust project file reader
18. octet stream body
19. run a task to change the base path for every request to relative
20. bugs
    1.  source auth is not set
    2.  source auth not set should give error 
21. unverified
    1.  editor right click shows optional paramters
