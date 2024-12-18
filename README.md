# 🏰 Kingdom Architect
> Medieval simulation and city builder game for the browser.

![GitHub License](https://img.shields.io/github/license/trymnilsen/kingdomarchitect)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/trymnilsen/kingdomarchitect/main.yml)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-f8bc45.svg)](https://github.com/prettier/prettier)


![Screenshot of the game](doc/screenshot/gameplay.png)

## 🕹️ Play

> [!NOTE]  
> This game is currently in development. There will be things that are broken/not working/not implemented.

You can either clone this repository and run it based on the instructions on how to run the game below, or try the last version out at [https://kingdomarchitect.netlify.app](https://kingdomarchitect.netlify.app)

### How to play
- Gather resources
- Discover new lands
- Build houses to spawn workers
- Level up the skills of workers as wizards, knights or archers
- Defend against enemy mobs

### Controls
#### Pointer/Touch input
Tap the item you would like to select or activate

#### Keyboard input
`WASD`: Use the W,A,S,D keys to move the cursor or selected items directionally

`Escape`: Go back, cancel or unselect

`E`: Activate the current selection or action

`1-9`: Activate the n'th actionbar button

`M`: Cycle between focus groups

`J`: Activate the first secondary actionbar item

`K`: Activate the second secondary actionbar item

#### Gamepad input
Not yet available

## 📜 About the project
Kingdom architects is intended to be a combined simulation and city building game around building your own kingdom and protecting it from hordes of evil monsters. It is intended to be single-player and playable both on mobile screens and desktop size clients. Your kingdom might last for decades or only seconds, who knows what the legends of your reign will be.

### Goals for the project
- Play both using the keyboard and mouse/touch.
- Only depend on browser-apis, no extra libraries or third party frameworks.
- Kingdoms are ephemeral, they only exists within the memory of the browser. Once it's closed only bards will sing the tales of your kingdom. Something rewarding should happen from the start.
- Progress in some way should be able to be carried over into future kingdoms, rogue-lite style.

## 🙋 Contributing
### I have a suggestion for a feature
Great, if you feel like it aligns with the goal for the project open a thread under discussion with some details on your idea

### I have found a bug
Fantastic, getting bug reports is important. File an issue with steps to reproduce 🙏.

### I want to help code the game
Wow, thanks! First see if there are any open issues or open a thread under discussion on the improvement or contribution you would like to make.

## 👩‍💻 Development
### Requirements
- Node v20 or higher
- An editor to edit typescript with

### Get set up
Install the required development packages (typescript and rollup) with `npm i`. Build and bundle the typescript source with `npm run build`. `npm run start` will start a development server and give you a link to test out the game locally. Use your favourite IDE to edit any typescript game code. If you want to contribute on the development on the game, here follows some notes on the architecture for the game/application and some tools used during development.

### Concepts
The architecture of the game is loosely based around three concepts:
- A timer ticking
- An entity component system for the gameplay logic
- A state system for the HUD/GUI

#### Game updates
Every 200ms a timer invokes two code paths for most of the game components. An update function and a draw function.
The update function should only be invoked once per every 5th tick, effectively ticking every second. The draw logic will be called at least every tick, but might be invoked more often if there is input or other events occuring that should trigger a redraw. Be wary of putting logic depending on a timed update in the draw code path. Panning the gameworld is a good example of when the draw method of the different classes are invoked, this method is executed on each drag event from the browser.

#### Entity component system
The architecture of the game code is based around a variant of an Entity component system. Systems can set up queries for components, and schedule themselves using events. Example of events are for rendering, update or input, but also for transforms or changes to the list of entities. Events are interupting within a system. If a transform event is triggered and dispatched within a system, it will immediately run the systems listenering. This is intended for supporting systems that might update collision maps, pathfinding graphs or visibility maps. Components extend the EcsComponent type, an empty class. This is to assert that components have a constructor, which is used as they key for lookups. Entities are aliased from numbers, they dont contain anything other than their ID. This id is used to group components making a group of component a logical entity. Lastly the World binds it all together. It keeps a collection of all components and their relation to an entity, and a collection of all the systems and the logic for dispatching events to them.

#### A state system for the HUD/GUI
Items that are not directly connected to the game world, like menus and screens are considered `InteractionStates` these are screens that can be navigated to and from in a stack. States can draw custom actions and handle events as well as setting up complex views using the custom UI system

### Folder Structure
| Folder name | Function                                                      |
|-------------|---------------------------------------------------------------|
| asset       | code related to load and lookup of assets can be found here.  |
| common      | generic code that can be used across the whole application    |
| data        | defintions and lists for the items/buildings in game          |
| game        | the game logic, both hud and world code                       |
| input       | code related to recieveing input from the browser             |
| path        | pathfinding and graphing code                                 |
| persistence | logic for saving and loading state                            |
| rendering   | code related to drawing pixels on the game canvas             |
| ui          | a custom ui system for setting up GUI elements and screens    |

### Tooling
#### Transpiling and bundling
Typescript and rollup is used for transpiling, typechecking and bundling the code.
This is performed with the `build` npm task.

### Testing
Note: The test suite uses the node test runner and requires node >=20.

Some tests already exists for the game, these are made with the built in node test runner. Note that files are not automatically built when tests are run. These needs to be built independently (however the `npm test` script includes the tsc step before the tests are run). Some files are currently just scaffold and some contain actuall test code. Tests can be run with `npm  test`.

### Custom tooling
#### Spritepacking
- **Task:** `spritepack`
- **Note:** typescript sources needs to be built before the task can run

To optimize, remove unused parts of images and bundling them together into a spritebin the `spritepack` npm task can be used. If you update any of the images in `asset` you need to run this task to get the updated version to show up in game. The source for this can be found in `ts/tool/spritepack`.

## ❓ FAQ
No questions so far