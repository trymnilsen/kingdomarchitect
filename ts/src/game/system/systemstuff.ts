// Base component type
interface Component {
    id: string;
}

// Physics components
type TransformComponent = {
    id: "transform";
    x: number;
    y: number;
    rotation: number;
};

type VelocityComponent = {
    id: "velocity";
    velocityX: number;
    velocityY: number;
};

// Rendering components
type DrawableComponent = {
    id: "drawable";
    sprite: string;
};

// Organize components into nested groups
type PhysicsComponents = TransformComponent | VelocityComponent;
type RenderingComponents = DrawableComponent;

// Flatten the components into a single union
type AllComponents = PhysicsComponents | RenderingComponents;
type ComponentID = AllComponents["id"];

type ComponentRegistry = {
    [C in AllComponents as C["id"]]: C;
};

function getComponent<T extends ComponentID>(id: T): ComponentRegistry[T] {
    throw new Error("Not implemented");
}

const foo = getComponent("transform");
