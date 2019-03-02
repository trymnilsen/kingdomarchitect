// require('@google-cloud/trace-agent').start();
// require('source-map-support').install();
// require('@google-cloud/debug-agent').start({ 
//     allowExpressions: true,
//     projectId: "kingdomarchitect"
// });
const app = require("./build/server/application");
app.bootstrap();