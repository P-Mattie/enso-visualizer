const { app, BrowserWindow } = require("electron");
const fs = require("fs");

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true, // For Electron v12 and later
    },
  });

  mainWindow.loadFile("index.html");

  const { spawn } = require("child_process");
  const captureProcess = spawn("parec", [
    "--device=alsa_output.usb-PreSonus_Studio_24c_SC1E20414599-00.analog-stereo.monitor",
    "--format=s16le",
    "--rate=44100",
    "--channels=2",
    `captured_audio.raw`, // Specify the output file explicitly
  ]);

  captureProcess.stdout.on("data", (data) => {
    console.log("Received audio data:", data);
  });

  captureProcess.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  captureProcess.on("close", (code) => {
    console.log(`parec process exited with code ${code}`);
  });

  mainWindow.on("closed", () => {
    captureProcess.kill();
  });
});
