# Roadmap

1. Sources
   1. ~~ui redesign~~
   2. sync tokens
      1. ~~store in keychain~~
      2. ~~prevent duplicate sources to be added~~
      3. auth 'and' logic
      4. ~~if source fetch fails with 401, show set token~~
      5. ~~replace source tokens page with sources page~~
         1. ~~allow deleting a source~~
         2. ~~updating the tokens~~
         3. ~~fetch changess~~
         4. ~~clear titlebar indicator after going to sources page~~
   3. remove or update token from folder settings
   4. authentication
      1. github
      2. general
   5. test parse failures
   6. prefer default value over name
   7. right click options
      1. reset to spec
   8. reorder auth methods from settings
   9. refactor
      1. folder settings auth resolver, take request returned authenticated
   10. spec integration
      1. lint
      2. autocomplete
2. back and forward recent requests
3. request snippet
   1. select a range of text
   2. create snippet, set a name
   3. saved to a file next to request
   4. folder snippets??
4. http editor line wrap
5. performance optimizations
   1. scope tree changes to the folder that changed
6. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
7. actions - pin rethink
   1. ~~remove titlebar new action when no action exists~~
   2. ~~always show actions folder~~
   3. show hint when it's empty
   4. ~~remove shortcut keybinding (maybe can be defined by use later, we'll see)~~
   5. ~~side bar item shows a play icon to run the action from sidebar~~
   6. ~~play icon has the same progress and error indication that current titlebar action has~~
   7. ~~the common flow (run the token request) will be handled by pin request feature~~
8. search
   1. recent requests
9.  security
   1. stripout auth from history by default
      1. setting to override it
10. file tree
    1. rename
    2. view options
       1. show/hide scripts
    3. open scripts after creation
    4. move script creation out of FileTree
    5. show request urls as filenames and group by path?
    6. pin to top
       1. in postchi folder in pinned.json
       2. path relative to project root, so actions can be pinned possibly in future
       3. pinned items have an execute button -> executable trait
       4. shift+mod+enter for first pinned -> shortcut trait
11. scripts
    1. single source to derive execution and auto complete options from
12. import
    1. postman
         1. open folder after import
    2. open api
13. save file  
    1. when closing the app
14. errors
    1. unexpected token, text after a variable or function in header
    2. MissingKey
    3. DuplicateValue
    4. MissingValue
    5. FilePathNotExist
    6. PathIsDirectory
    7. InvalidContentType
    8. Invalid Environment (empty name)
15. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
16. octet stream body
17. run a task to change the base path for every request to relative
18. bugs
19. unverified
    1.  editor right click shows optional paramters
