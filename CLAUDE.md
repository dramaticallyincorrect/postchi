# Postchi is an api client desktop app.

## Tech Stack

postchi is written in typescripts using tauri and react. shadcn is used for the ui library.

## Style of coding

1. prefer functional programming over oop
2. testable without mocks as much as possible
3. use data and network abstractions in src/lib to be able to run the app in the browser aswell

## File Structure

Postchi is structured into layers

1. src/postchi
   1. contains the core postchi code, no ui or react. things like http template ast, http runner, project file access and creation go here
2. sr/app
   1. react app, everything ui related goes here.
3. src/components
   1. none app related components like buttons, inputs got here
4. sr/lib
   1. contains abstraction to interact with storage and network layer, also some utilities
   2. src/lib/storage; contains abstractions for file storage and key value store