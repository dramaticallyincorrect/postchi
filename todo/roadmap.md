# Roadmap

1. Sources
   1. ~~ui redesign~~
   2. authentication
      1. github
      2. general
   3. test parse failures
   4. prefer default value over name
   5. refactor
      1. folder settings auth resolver, take request returned authenticated
      2. break live source steps out into components, handle state inside each
   6. spec integration
      1. lint
      2. autocomplete
   7.  git ignored?
      1. what happends if we don't?
      2. if we were, retrieve the spec from remote on project import?
2. back and forward recent requests
3. end to end tests
   1. import
      1. postman
      2. open api
      3. open api source
   2. source changes apply
   3. send request
      1. normal
      2. base path + env change
4. actions - pin rethink
   1. remove titlebar new action when no action exists
   2. always show actions folder
   3. show hint when it's empty
   4. remove shortcut keybinding (maybe can be defined by use later, we'll see)
   5. side bar item shows a play icon to run the action from sidebar
   6. play icon has the same progress and error indication that current titlebar action has
   7. the common flow (run the token request) will be handled by pin request feature
5. search
   1. recent requests
6. security
   1. store credentials in keychain
   2. stripout auth from history by default
      1. setting to override it
7.  file tree
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
8.  scripts
    1. single source to derive execution and auto complete options from
9.  import
    1. postman
         1. open folder after import
    2. open api
10. auto complete
      1. context aware values
11. save file  
    1. when closing the app
12. errors
    1. unexpected token, text after a variable or function in header
    2. MissingKey
    3. DuplicateValue
    4. MissingValue
    5. FilePathNotExist
    6. PathIsDirectory
    7. InvalidContentType
    8. Invalid Environment (empty name)
13. last
    1. read file
    2. disable auto complete for headers, json body and nested functions
    3. show error
    4. none json body in response view
14. octet stream body
15. run a task to change the base path for every request to relative
16. bugs
    1.  + not being accepted in header value
