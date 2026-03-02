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
      5. context aware values
         1. ~~content type~~
         2. no read file for headers
         3. no read file for nested functions
         4. body snippet
3. save file
   1. when should a file be saved
      1. when closing the app
      2. ~~when editor loses focus~~
4. run request
   1. ~~url encoded form~~
   2. ~~multipart form~~
   3. ~~resolve function expressions~~
   4. ~~resolve env variables~~
   5. octet stream
5. errors
    1. move all errors out of ast
    2. UnSupportedFunction
    3. MissingParameterValue
    4. MissingKey
    5. DuplicateValue
    6. MissingValue
    7. FilePathNotExist
    8. PathIsDirectory
    9. ~~VariableNotDefined~~
    10. ~~InValidVariableDefinition~~
    11. RelativeUrlShouldStartWithSlash
    12. InvalidContentType
    13. JsonBodyError
    14. Invalid Environment (empty name)
    15. read file used as an argument of another function
    16. read file used in header
