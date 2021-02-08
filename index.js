const { app, BrowserWindow } = require("electron");
const server = require("./server");

function createWindow() {
  // Create the application window and initialise the Express server.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      plugins: true,
    },
  });

  mainWindow.setResizable(true);

  mainWindow.loadURL("http://localhost:8888/login");
  mainWindow.focus();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// This method is called when Electron has finished initialisation.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
