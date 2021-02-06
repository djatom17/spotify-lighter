const { app, BrowserWindow } = require("electron");

app.on("ready", () => {
  let myWindow = new BrowserWindow({
    width: 1000,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  myWindow.loadFile("index.html");
});
