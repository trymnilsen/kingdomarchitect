import { timeline } from "./timelineBuilder.ts";

// SE: blink twice, turn to face SW at frame 20, blink twice more
const idleSoutheast = timeline("idle_southeast")
    .basedOn("walk_southeast", 0)
    .duration(40)
    .part("LeftEye", (t) =>
        t.at(8).hide().at(9).show()
         .at(14).hide().at(15).show()
         .at(28).hide().at(29).show()
         .at(34).hide().at(35).show(),
    )
    .part("RightEye", (t) => t.copyFrom("LeftEye"))
    .part("Head", (t) =>
        t.at(8).addPixels("LeftEye").addPixels("RightEye")
         .at(14).addPixels("LeftEye").addPixels("RightEye")
         .at(28).addPixels("LeftEye").addPixels("RightEye")
         .at(34).addPixels("LeftEye").addPixels("RightEye"),
    )
    .at(20).mirror()
    .build();

// SW: same animation, opposite starting direction
const idleSouthwest = timeline("idle_southwest")
    .basedOn(idleSoutheast)
    .mirror()
    .build();

// NE: back-facing, no visible eyes — just the mid-animation turn
const idleNortheast = timeline("idle_northeast")
    .basedOn("walk_northeast", 0)
    .duration(40)
    .at(20).mirror()
    .build();

// NW: mirror of NE
const idleNorthwest = timeline("idle_northwest")
    .basedOn(idleNortheast)
    .mirror()
    .build();

export const codeDefinedRecipes = [
    idleSoutheast,
    idleSouthwest,
    idleNortheast,
    idleNorthwest,
];
