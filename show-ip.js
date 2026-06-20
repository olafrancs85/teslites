// show-ip.js
const ip = require("ip");

const localIP = ip.address();
const port = 3000; // default Next.js port

console.log(`
🚀 Your app is running:
   Laptop:  http://localhost:${port}
   Network: http://${localIP}:${port}
`);
