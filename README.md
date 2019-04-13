# Kingdom Architect
> Medieval multiplayer simulation/city builder game for the browser.

Kingdom architects is intended to be a combined simulation and city building game around building your own kingdom on an island with out players, both human and simulated.

The goal of the client is to write it without any included libraries, only the api's provided by the browser and the typescript written in this repo is used. 

## Installation

```sh
npm install
```

## Development setup

### Running

`npm run live-start` can be used to start nodemon watching the node server serving both the api, static files and websocket.


### Running tests

The `npm run ci` builds, lints and tests the project. Have a look at the `package.json` to view the other options.