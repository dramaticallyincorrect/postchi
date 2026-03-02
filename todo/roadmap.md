# Roadmap

1. ast
   1. ~~form body~~
   2. decides on body type based on content type if present or the inferred content type when not present
2. editor
   1. ~~lints~~
   2. auto complete
      1. ~~method~~
      2. ~~headers~~
      3. ~~functions~~
         1. ~~readText, readFile path completion~~
         2. ~~nested functions~~
         3. args with spaces or trailing spaces
         4. < as param throws error
      4. varialbes
         1. ~~url~~
         2. ~~header~~
         3. ~~function parameters~~
         4. ~~form~~
         5. json
3. save file
   1. when should a file be saved
      1. when closing the app
      2. ~~when editor loses focus~~
4. run request
   1. url encoded form
   2. multipart form
   3. resolve function expressions
   4. ~~resolve env variables~~
5. errors
    1. UnSupportedFunction
    2. MissingParameterValue
    3. MissingKey
    4. DuplicateValue
    5. MissingValue
    6. FilePathNotExist
    7. PathIsDirectory
    8. ~~VariableNotDefined~~
    9. ~~InValidVariableDefinition~~
    10. RelativeUrlShouldStartWithSlash
    11. InvalidContentType
    12. JsonBodyError
    13. Invalid Environment (empty name)
