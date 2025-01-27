const { spawn } = require("child_process");
const { ipcMain } = require("electron");

let sinkName;

ipcMain.on("updateAudioSrc", (event, data) => {
  sinkName = data;
});

function startAudioStream(mainWindow) {
  let captureProcess = null;

  if (captureProcess) {
    captureProcess.kill();
    captureProcess = null;
  }

  console.log(sinkName);
  captureProcess = spawn("parec", [
    `--device=${sinkName}`,
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
}

module.exports = {
  startAudioStream,
};
