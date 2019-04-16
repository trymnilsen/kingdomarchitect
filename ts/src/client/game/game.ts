import { WorldScene, WorldSceneName } from "./gameScene/world/worldScene";
import { GameSceneHandler } from "./gameScene/gameScene";
import { Renderer } from "./rendering/renderer";
import { Input } from "../input/input";
import {
    Simulation,
    SimulationEvent
} from "../../common/simulation/simulation";
import { JsonTree } from "../../common/jsontree/jsonNode";
import {
    applyOperations,
    NodeOperation
} from "../../common/jsontree/nodeOperations";
import { SocketChannel } from "../network/websocketConnection";
import { GameEvent } from "../../common/data/event/gameEvent";
import { action } from "../../common/simulation/action";
import { InputActionName } from "../input/inputAction";

export class Game {
    private sceneHandler: GameSceneHandler;
    private renderer: Renderer;
    private input: Input;
    private state: JsonTree;
    private simulation: Simulation;
    public constructor(
        domElementWrapperSelector: string,
        channel: SocketChannel<GameEvent>
    ) {
        this.input = new Input();
        this.state = new JsonTree();
        this.simulation = new Simulation(this.state);
        channel.send({ id: "join", data: "gameid" });
        //Input
        this.input.onInput.listen((inputEvent) => {
            const simulationEvent = {
                source: "local_player",
                action: inputEvent.action
            };
            const inputAction = action(InputActionName, inputEvent.action);
            const operations = this.simulation.dispatchAction(inputAction);
            channel.send({
                id: "action",
                data: inputAction
            });
            applyOperations(operations, this.state);
        });
        this.renderer = new Renderer(domElementWrapperSelector);
        this.sceneHandler = new GameSceneHandler();

        channel.listen((channelEvent) => {
            console.log("Channel event recieved", channelEvent);
            switch (channelEvent.id) {
                case "action":
                    console.log("Ignoring action recieved", channelEvent.data);
                    break;
                case "sync":
                    console.log("Received sync, updating state");
                    applyOperations(channelEvent.data, this.state);
                    break;
                case "join":
                    console.log("Ignoring join recieved", channelEvent.data);
                    break;
                default:
                    console.warn(
                        "Unknown channel event received",
                        channelEvent
                    );
            }
        });

        this.state.listen((event) => {
            this.renderer.render();
        });

        this.sceneHandler.registerScene(
            WorldSceneName,
            new WorldScene(this.renderer.rootNode)
        );
        this.sceneHandler.transition(WorldSceneName);
        //TODO: Setup input
        this.renderer.render();
    }

    public dispose(): any {
        this.sceneHandler.disposeAllScenes();
        this.state.dispose();
    }
}
