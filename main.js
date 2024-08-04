const { app, BrowserWindow, screen, ipcMain } = require("electron");
const {
  startAudioStream,
} = require("./modules/main/audio-source/stream-audio-src");
const { sendAudioSrcs } = require("./modules/main/audio-source/get-audio-srcs");
const { setMainWindow } = require("./modules/utils");

// ------------------------------  Setup
let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  // Set window position
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const windowWidth = 800;
  const windowHeight = 600;
  mainWindow.setBounds({
    x: width - windowWidth,
    y: 0,
    width: windowWidth,
    height: windowHeight,
  });

  // Load HTML file
  mainWindow.loadFile("index.html");
}

app.on("ready", () => {
  createMainWindow();
  setMainWindow(mainWindow);
  setTimeout(sendAudioSrcs, 2000);
});

ipcMain.on("start-audio-stream", (event, data) => {
  startAudioStream(mainWindow);
});
