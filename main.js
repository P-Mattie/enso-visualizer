const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  ipcRenderer,
} = require("electron");
const { spawn, exec } = require("child_process");

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

  setTimeout(sendAudioSrcs, 2000);
});

// ------------------------------ Get Audio Src

ipcMain.on("getAudioSrcs", (event) => {
  sendAudioSrcs();
});

function getAudioSrcs() {
  return new Promise((resolve, reject) => {
    exec(
      "LANG=C pactl list | grep -A2 'Source #' | grep 'Name: ' | cut -d\" \" -f2",
      (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing pactl:", error);
          reject(error);
          return;
        }
        if (stderr) {
          console.error("stderr output:", stderr);
          reject(new Error(stderr));
          return;
        }

        const audioSrcs = stdout
          .split("\n")
          .filter((line) => line.trim() !== "");
        resolve(audioSrcs);
      }
    );
  });
}

function sendAudioSrcs() {
  getAudioSrcs()
    .then((audioSrcs) => {
      // console.log(audioSrcs);
      mainWindow.webContents.send("audioSrcs", audioSrcs);
    })
    .catch((error) => {
      console.log("error fetching audio sources:", error);
    });
}

// ------------------------------ Read Audio src
app.on("ready", () => {
  // Start audio capture process
  const captureProcess = spawn("parec", [
    "--device=alsa_output.usb-PreSonus_Studio_24c_SC1E20414599-00.analog-stereo.monitor",
    "--format=s16le",
    "--rate=44100",
    "--channels=2",
  ]);

  let audioBuffer = Buffer.from([]);

  captureProcess.stdout.on("data", (data) => {
    audioBuffer = Buffer.concat([audioBuffer, data]);

    // Check if the buffer contains enough data to decode
    const chunkSize = 4096; // Adjust according to your needs
    while (audioBuffer.length >= chunkSize) {
      const chunk = audioBuffer.slice(0, chunkSize);
      audioBuffer = audioBuffer.slice(chunkSize);

      // Decode the chunk using decodePCM function
      const decodedData = decodePCM(chunk);

      // Send the decoded audio data to the renderer process
      mainWindow.webContents.send("audioData", decodedData);
    }
  });

  captureProcess.on("error", (error) => {
    console.error("Capture process error:", error);
  });

  captureProcess.on("exit", (code, signal) => {
    console.log("Capture process exited with code:", code);
    console.log("Capture process exited with signal:", signal);
  });
});

// Function to decode raw PCM data to Float32Array
function decodePCM(rawData) {
  const numSamples = rawData.length / 2; // Assuming 16-bit PCM data
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const offset = i * 2; // 2 bytes per sample for 16-bit PCM
    const sample = rawData.readInt16LE(offset) / 32768; // Convert to float32
    samples[i] = sample;
  }

  return samples;
}
