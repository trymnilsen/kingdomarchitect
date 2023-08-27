# 🏰 Kingdom Architect
> Medieval simulation and city builder game for the browser.

![Screenshot of the game](screenshot/gameplay.png)

## 🕹️ Play

You can either clone this repository and run it based on the instructions on how to run the game below, or try the last version out at [https://kingdomarchitect.netlify.app](https://kingdomarchitect.netlify.app)

### How to play

- Gather resources
- Unlock land
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
- Only depend on browser-apis, no extra libraries.

## 🙋 Contributing

### I have a suggestion for a feature
Great, if you feel like it aligns with the goal for the project open a thread under discussion with some details on your idea

### I have found a bug
Fantastic, getting bug reports is important. File an issue with steps to reproduce 🙏.

### I want to help code the game
Wow, thanks! First see if there are any open issues or open a thread under discussion on the improvement or contribution you would like to make.

## 👩‍💻 Development

Install the required development packages (typescript and rollup) with `npm i`. Build and bundle the typescript source with `npm run build`, you should then be able to run it with the `npm run start` command and get a link in your terminal to test out the locally built version in your browser of choice. Your favourite IDE can be used to edit any game code. If you want to contribute on the development on the game, here follows some notes on the architecture for the game/application and some tools used during development.

### Concepts
The architecture of the game is loosely based around three concepts:
- A timer ticking each second
- An entity tree and component system
- A state system for the HUD/GUI

#### Game updates
Ever second a timer invokes two code paths for most of the game components. An update function and a draw function.
The update function should only be invoked once per timer tick, but the draw method can be called multiple. Be wary of putting
logic depending on a timed update as it will be invoked potentially more than one time per tick when input events happen or other
actions are perfomed. Panning the gameworld is a good example of when the draw method of the different classes are invoked, this method
is executed on each drag event from the browser.

#### Entity component system
A entity component system is in the works where all items in the world are tied to an entity with some amount of componets on it handle updates and draw actions. Some exceptions exists like tiles where all tiles belong to the same entity with a component that is responsible for drawing and handling all the tiles. All new game world items and data will be stored in components on entities.

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
| rendering   | code related to drawing pixels on the game canvas             |
| ui          | a custom ui system for setting up GUI elements and screens    |

### Tooling

#### Transpiling and bundling

Typescript and rollup is used for transpiling, typechecking and bundling the code.
This is performed with the `build` npm task.

#### Spritepacking

To optimize, remove unused parts of images and bundling them together into a spritebin the `spritepack` npm task can be used. If you update any of the images in `asset` you need to run this task to get the updated version to show up in game. The source for this can be found in `ts/tool/spritepack`.

### Testing

Note: The test suite uses the node test runner and requires node >=20.

Some tests already exists for the game, these are made with the built in node test runner. Note that files are not automatically built when tests are run. These needs to be built independently (however the `npm test` script includes the tsc step before the tests are run). Some files are currently just scaffold and some contain actuall test code. Tests can be run with `npm  test`.

## ❓ FAQ

No questions so far