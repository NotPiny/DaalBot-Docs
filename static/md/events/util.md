# Event Utils
This module provides utility functions for working with events since obviously you cant do stuff like interact with the filesystem / make network requests in a event.

## Functions
### `variables.get(key: string, global: boolean = false): Promise<string | null>`
Gets a variable from the database. If the variable does not exist, it will return `null`. If `global` is set to `true`, it will get the variable from the guild store instead of the per-event store.

### `variables.set(key: string, value: any, global: boolean = false): Promise<void>`
Sets a variable in the database. If `global` is set to `true`, it will set the variable in the guild store instead of the per-event store.

## Libraries
### `axios`
A promise based HTTP client for the browser and node.js.
### `crypto`
Built in Node.js module that provides cryptographic functionality.