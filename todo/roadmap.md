# Roadmap

1. Sources
   1. ~~parse open api spec~~
   2. ~~check for updates~~
   3. show indicator in title bar
   4. show diff
   5. warn local changes
2. back and forward recent requests
3. end to end tests
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
6. reorganize packages
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
9.  quick actions
    1. set from file tree
10. import
    1. postman
         1. open folder after import
    2. open api
11. auto complete
      1. context aware values
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
