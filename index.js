require("dotenv").config();
const express = require("express");
const app = express();

const ParseServer = require("parse-server").ParseServer;

const port = process.env.SERVER_PORT || 1337;

const api = new ParseServer({
  databaseURI: process.env.DB_URI,
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL,
  publicServerURL: process.env.PUBLIC_SERVER_URL,
  port: process.env.SERVER_PORT,
  cloud: "./cloud/main.js",
  allowClientClassCreation: false,
  enforcePrivateUsers: true,
  directAccess: true,
  maxUploadSize: "5mb",
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/parse", api);

app.listen(port, () => {
  console.log(
    `\n\n\n[${new Date().toLocaleString()}] - ⚡️[server]: Server is running at http://localhost:${port}`
  );
});
