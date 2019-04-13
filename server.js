// require('@google-cloud/trace-agent').start();
// require('source-map-support').install();
// require('@google-cloud/debug-agent').start({
//     allowExpressions: true,
//     projectId: "kingdomarchitect"
// });
const app = require("./build/src/server/application");
const expressApp = app.bootstrap(true);
