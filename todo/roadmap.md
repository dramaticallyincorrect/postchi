# Roadmap

1. Sources
   1. ~~ui redesign~~
   2. sync tokens
      1. ~~store in keychain~~
      2. if source fetch fails with 401, show set token
      3. replace source tokens page with sources page
         1. allow deleting a source
         2. updating the tokens
         3. fetch changes
   3. ed api security is recognized wrong as header
   4. remove or update token from folder settings
   5. authentication
      1. github
      2. general
   6. test parse failures
   7. prefer default value over name
   8.  reorder auth methods from settings
   9.  refactor
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
5. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
6. actions - pin rethink
   1. remove titlebar new action when no action exists
   2. always show actions folder
   3. show hint when it's empty
   4. remove shortcut keybinding (maybe can be defined by use later, we'll see)
   5. side bar item shows a play icon to run the action from sidebar
   6. play icon has the same progress and error indication that current titlebar action has
   7. the common flow (run the token request) will be handled by pin request feature
7. search
   1. recent requests
8. security
   1. stripout auth from history by default
      1. setting to override it
9.  file tree
    1. rename
    2. view options
       1. show/hide scripts
    3. open scripts after creation
    4. move script creation out of FileTree
    5. show request urls as filenames and group by path?
    6. pin to top
       1. pinned items have an execute button
       2. shift+mod+enter for first pinned
       3. play icon on pinned items
10. scripts
    1. single source to derive execution and auto complete options from
11. import
    1. postman
         1. open folder after import
    2. open api
12. save file  
    1. when closing the app
13. errors
    1. unexpected token, text after a variable or function in header
    2. MissingKey
    3. DuplicateValue
    4. MissingValue
    5. FilePathNotExist
    6. PathIsDirectory
    7. InvalidContentType
    8. Invalid Environment (empty name)
14. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
15. octet stream body
16. run a task to change the base path for every request to relative
17. bugs
18. unverified
    1.  editor right click shows optional paramters
